using Dapper;
using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using DatabaseDictionary.Infrastructure.Data;
using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Infrastructure.Repositories;

public class HeaderRepository : IHeaderRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public HeaderRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List<HeaderListItemDto>> SearchAsync(HeaderSearchQuery query)
    {
        var where = new List<string>();
        var parameters = new DynamicParameters();

        if (!string.IsNullOrWhiteSpace(query.DatabaseName))
        {
            where.Add("LOWER(h.DatabaseName) LIKE LOWER(@DatabaseName)");
            parameters.Add("DatabaseName", $"%{query.DatabaseName}%");
        }

        if (!string.IsNullOrWhiteSpace(query.ObjectName))
        {
            where.Add("LOWER(h.ObjectName) LIKE LOWER(@ObjectName)");
            parameters.Add("ObjectName", $"%{query.ObjectName}%");
        }

        if (!string.IsNullOrWhiteSpace(query.ColumnName))
        {
            where.Add("""
                h.HeaderId IN (SELECT c.HeaderId FROM dbo.TableColumn c WHERE LOWER(c.ColumnName) LIKE LOWER(@ColumnName))
                """);
            parameters.Add("ColumnName", $"%{query.ColumnName}%");
        }

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            where.Add("""
                (LOWER(h.DatabaseName) LIKE LOWER(@Keyword)
                 OR LOWER(h.DatabaseHost) LIKE LOWER(@Keyword)
                 OR LOWER(h.ObjectName) LIKE LOWER(@Keyword)
                 OR LOWER(h.ObjectType) LIKE LOWER(@Keyword)
                 OR LOWER(ISNULL(h.TableDescription, '')) LIKE LOWER(@Keyword)
                 OR LOWER(ISNULL(h.OtherDescription, '')) LIKE LOWER(@Keyword)
                 OR LOWER(ISNULL(h.Remark, '')) LIKE LOWER(@Keyword))
                """);
            parameters.Add("Keyword", $"%{query.Keyword}%");
        }

        var whereClause = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";
        var sql = $"""
            SELECT h.HeaderId, h.DatabaseHost, h.DatabaseName, h.ObjectType, h.ObjectName,
                   h.TableDescription, h.OtherDescription
            FROM dbo.TableHeader h
            {whereClause}
            ORDER BY h.HeaderId DESC
            """;

        using var connection = _connectionFactory.CreateConnection();
        var result = await connection.QueryAsync<HeaderListItemDto>(sql, parameters);
        return result.ToList();
    }

    public async Task<HeaderDetailDto?> GetByIdAsync(int headerId)
    {
        using var connection = _connectionFactory.CreateConnection();

        var header = await connection.QuerySingleOrDefaultAsync<HeaderDetailDto>(
            """
            SELECT HeaderId, DatabaseName, DatabaseHost, ObjectType, ObjectName,
                   TableDescription, OtherDescription, Remark, ConnPort, ConnAccount, ConnPassword, UseWindowsAuth
            FROM dbo.TableHeader
            WHERE HeaderId = @HeaderId
            """,
            new { HeaderId = headerId });

        if (header is null)
        {
            return null;
        }

        var columns = await connection.QueryAsync<ColumnDto>(
            """
            SELECT ColumnId, Sequence, ColumnName, ColumnDescription, DataType, IsNullable,
                   DefaultValue, IsPrimaryKey, IsIdentity, ParamDirection, Remark
            FROM dbo.TableColumn
            WHERE HeaderId = @HeaderId
            ORDER BY Sequence
            """,
            new { HeaderId = headerId });

        header.Columns = columns.ToList();
        return header;
    }

    public async Task<bool> ExistsDuplicateAsync(string databaseHost, string databaseName, string objectName, int? excludeHeaderId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.ExecuteScalarAsync<int>(
            """
            SELECT COUNT(1) FROM dbo.TableHeader
            WHERE LOWER(DatabaseHost) = LOWER(@DatabaseHost)
              AND LOWER(DatabaseName) = LOWER(@DatabaseName)
              AND LOWER(ObjectName) = LOWER(@ObjectName)
              AND (@ExcludeHeaderId IS NULL OR HeaderId <> @ExcludeHeaderId)
            """,
            new { DatabaseHost = databaseHost, DatabaseName = databaseName, ObjectName = objectName, ExcludeHeaderId = excludeHeaderId });
        return count > 0;
    }

    public async Task<int> CreateAsync(HeaderDetailDto header)
    {
        using var connection = (SqlConnection)_connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            var headerId = await connection.ExecuteScalarAsync<int>(
                """
                INSERT INTO dbo.TableHeader
                    (DatabaseName, DatabaseHost, ObjectType, ObjectName, TableDescription, OtherDescription,
                     Remark, ConnPort, ConnAccount, ConnPassword, UseWindowsAuth)
                OUTPUT INSERTED.HeaderId
                VALUES
                    (@DatabaseName, @DatabaseHost, @ObjectType, @ObjectName, @TableDescription, @OtherDescription,
                     @Remark, @ConnPort, @ConnAccount, @ConnPassword, @UseWindowsAuth)
                """,
                header, transaction);

            await InsertColumnsAsync(connection, transaction, headerId, header.Columns);

            transaction.Commit();
            return headerId;
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task UpdateAsync(HeaderDetailDto header)
    {
        using var connection = (SqlConnection)_connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            await connection.ExecuteAsync(
                """
                UPDATE dbo.TableHeader SET
                    DatabaseName = @DatabaseName,
                    DatabaseHost = @DatabaseHost,
                    ObjectType = @ObjectType,
                    ObjectName = @ObjectName,
                    TableDescription = @TableDescription,
                    OtherDescription = @OtherDescription,
                    Remark = @Remark,
                    ConnPort = @ConnPort,
                    ConnAccount = @ConnAccount,
                    ConnPassword = @ConnPassword,
                    UseWindowsAuth = @UseWindowsAuth
                WHERE HeaderId = @HeaderId
                """,
                header, transaction);

            await connection.ExecuteAsync(
                "DELETE FROM dbo.TableColumn WHERE HeaderId = @HeaderId",
                new { header.HeaderId }, transaction);

            await InsertColumnsAsync(connection, transaction, header.HeaderId, header.Columns);

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task DeleteAsync(int headerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        await connection.ExecuteAsync(
            "DELETE FROM dbo.TableHeader WHERE HeaderId = @HeaderId",
            new { HeaderId = headerId });
    }

    private static async Task InsertColumnsAsync(SqlConnection connection, SqlTransaction transaction, int headerId, List<ColumnDto> columns)
    {
        if (columns.Count == 0)
        {
            return;
        }

        var rows = columns.Select(c => new
        {
            HeaderId = headerId,
            c.Sequence,
            c.ColumnName,
            c.ColumnDescription,
            c.DataType,
            c.IsNullable,
            c.DefaultValue,
            c.IsPrimaryKey,
            c.IsIdentity,
            c.ParamDirection,
            c.Remark
        });

        await connection.ExecuteAsync(
            """
            INSERT INTO dbo.TableColumn
                (HeaderId, Sequence, ColumnName, ColumnDescription, DataType, IsNullable,
                 DefaultValue, IsPrimaryKey, IsIdentity, ParamDirection, Remark)
            VALUES
                (@HeaderId, @Sequence, @ColumnName, @ColumnDescription, @DataType, @IsNullable,
                 @DefaultValue, @IsPrimaryKey, @IsIdentity, @ParamDirection, @Remark)
            """,
            rows, transaction);
    }
}
