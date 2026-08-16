using Dapper;
using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Infrastructure.Services;

/// <summary>Connects live to the target (source) database the user is cataloguing — never the app's own metadata store — to read its actual table structure.</summary>
public class SchemaInspector : ISchemaInspector
{
    public async Task<SchemaCompareResult> GetActualColumnsAsync(SchemaCompareRequest request)
    {
        var connectionString = BuildConnectionString(request);

        using var connection = new SqlConnection(connectionString);

        var rows = await connection.QueryAsync<ActualColumnRow>(
            """
            SELECT
                c.ORDINAL_POSITION AS Sequence,
                c.COLUMN_NAME AS ColumnName,
                CASE
                    WHEN c.DATA_TYPE IN ('decimal', 'numeric')
                        THEN c.DATA_TYPE + '(' + CAST(c.NUMERIC_PRECISION AS VARCHAR(10)) + ',' + CAST(c.NUMERIC_SCALE AS VARCHAR(10)) + ')'
                    WHEN c.DATA_TYPE IN ('varchar', 'nvarchar', 'char', 'nchar', 'varbinary', 'binary')
                        THEN c.DATA_TYPE + '(' + (CASE WHEN c.CHARACTER_MAXIMUM_LENGTH = -1 THEN 'MAX' ELSE CAST(c.CHARACTER_MAXIMUM_LENGTH AS VARCHAR(10)) END) + ')'
                    ELSE c.DATA_TYPE
                END AS DataType,
                CASE WHEN c.IS_NULLABLE = 'YES' THEN 1 ELSE 0 END AS IsNullable,
                c.COLUMN_DEFAULT AS DefaultValue,
                CASE WHEN pk.ColumnName IS NOT NULL THEN 1 ELSE 0 END AS IsPrimaryKey,
                ISNULL(COLUMNPROPERTY(OBJECT_ID(QUOTENAME(c.TABLE_SCHEMA) + '.' + QUOTENAME(c.TABLE_NAME)), c.COLUMN_NAME, 'IsIdentity'), 0) AS IsIdentity
            FROM INFORMATION_SCHEMA.COLUMNS c
            LEFT JOIN (
                SELECT ku.TABLE_SCHEMA, ku.TABLE_NAME, ku.COLUMN_NAME AS ColumnName
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
                JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
                    ON tc.CONSTRAINT_NAME = ku.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = ku.TABLE_SCHEMA
                WHERE tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
            ) pk ON pk.TABLE_SCHEMA = c.TABLE_SCHEMA AND pk.TABLE_NAME = c.TABLE_NAME AND pk.ColumnName = c.COLUMN_NAME
            WHERE c.TABLE_NAME = @ObjectName
            ORDER BY c.ORDINAL_POSITION
            """,
            new { request.ObjectName });

        return new SchemaCompareResult
        {
            Columns = rows.Select(r => new ActualColumnDto
            {
                Sequence = r.Sequence,
                ColumnName = r.ColumnName,
                DataType = r.DataType,
                IsNullable = r.IsNullable == 1,
                DefaultValue = r.DefaultValue,
                IsPrimaryKey = r.IsPrimaryKey == 1,
                IsIdentity = r.IsIdentity == 1
            }).ToList()
        };
    }

    private static string BuildConnectionString(SchemaCompareRequest request)
    {
        var dataSource = string.IsNullOrWhiteSpace(request.ConnPort)
            ? request.DatabaseHost
            : $"{request.DatabaseHost},{request.ConnPort}";

        var builder = new SqlConnectionStringBuilder
        {
            DataSource = dataSource,
            InitialCatalog = request.DatabaseName,
            TrustServerCertificate = true,
            ConnectTimeout = 10
        };

        if (request.UseWindowsAuth)
        {
            builder.IntegratedSecurity = true;
        }
        else
        {
            builder.UserID = request.ConnAccount ?? string.Empty;
            builder.Password = request.ConnPassword ?? string.Empty;
        }

        return builder.ConnectionString;
    }

    private class ActualColumnRow
    {
        public int Sequence { get; set; }
        public string ColumnName { get; set; } = string.Empty;
        public string DataType { get; set; } = string.Empty;
        public int IsNullable { get; set; }
        public string? DefaultValue { get; set; }
        public int IsPrimaryKey { get; set; }
        public int IsIdentity { get; set; }
    }
}
