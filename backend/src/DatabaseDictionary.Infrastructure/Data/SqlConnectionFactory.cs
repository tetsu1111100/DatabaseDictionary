using System.Data;
using Microsoft.Data.SqlClient;

namespace DatabaseDictionary.Infrastructure.Data;

/// <summary>Opens connections to the app's own metadata store (the SQL Server the user configured in appsettings), not to the databases being catalogued.</summary>
public class SqlConnectionFactory : IDbConnectionFactory
{
    private readonly string _connectionString;

    public SqlConnectionFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public IDbConnection CreateConnection() => new SqlConnection(_connectionString);
}
