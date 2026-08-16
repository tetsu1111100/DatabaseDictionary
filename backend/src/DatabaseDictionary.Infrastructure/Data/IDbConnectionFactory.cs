using System.Data;

namespace DatabaseDictionary.Infrastructure.Data;

public interface IDbConnectionFactory
{
    IDbConnection CreateConnection();
}
