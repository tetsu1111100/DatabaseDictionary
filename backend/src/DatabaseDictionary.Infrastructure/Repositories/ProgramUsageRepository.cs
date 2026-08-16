using Dapper;
using DatabaseDictionary.Core.Dtos;
using DatabaseDictionary.Core.Interfaces;
using DatabaseDictionary.Infrastructure.Data;
using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Infrastructure.Repositories;

public class ProgramUsageRepository : IProgramUsageRepository
{
    private readonly IDbConnectionFactory _connectionFactory;

    public ProgramUsageRepository(IDbConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List<ProgramUsageDto>> GetByHeaderIdAsync(int headerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var result = await connection.QueryAsync<ProgramUsageDto>(
            """
            SELECT SeqNo, ProgramName, Description
            FROM dbo.ProgramUsage
            WHERE HeaderId = @HeaderId
            ORDER BY SeqNo
            """,
            new { HeaderId = headerId });
        return result.ToList();
    }

    public async Task ReplaceAllAsync(int headerId, List<ProgramUsageDto> items)
    {
        using var connection = (SqlConnection)_connectionFactory.CreateConnection();
        await connection.OpenAsync();
        using var transaction = connection.BeginTransaction();
        try
        {
            await connection.ExecuteAsync(
                "DELETE FROM dbo.ProgramUsage WHERE HeaderId = @HeaderId",
                new { HeaderId = headerId }, transaction);

            if (items.Count > 0)
            {
                var rows = items.Select((item, index) => new
                {
                    HeaderId = headerId,
                    SeqNo = index + 1,
                    item.ProgramName,
                    item.Description
                });

                await connection.ExecuteAsync(
                    """
                    INSERT INTO dbo.ProgramUsage (HeaderId, SeqNo, ProgramName, Description)
                    VALUES (@HeaderId, @SeqNo, @ProgramName, @Description)
                    """,
                    rows, transaction);
            }

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public async Task<bool> HeaderExistsAsync(int headerId)
    {
        using var connection = _connectionFactory.CreateConnection();
        var count = await connection.ExecuteScalarAsync<int>(
            "SELECT COUNT(1) FROM dbo.TableHeader WHERE HeaderId = @HeaderId",
            new { HeaderId = headerId });
        return count > 0;
    }
}
