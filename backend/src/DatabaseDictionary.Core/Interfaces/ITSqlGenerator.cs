using DatabaseDictionary.Core.Dtos;

namespace DatabaseDictionary.Core.Interfaces;

public interface ITSqlGenerator
{
    string BuildCreateTable(CreateTableSqlRequest request);
    string BuildAddColumn(ColumnSqlRequest request);
    string BuildDropColumn(ColumnSqlRequest request);
    string BuildAlterColumn(ColumnSqlRequest request);
}
