namespace DatabaseDictionary.Core.Dtos;

public class CreateTableSqlRequest
{
    public string ObjectName { get; set; } = string.Empty;
    public List<ColumnDto> Columns { get; set; } = new();
}

public class ColumnSqlRequest
{
    public string ObjectName { get; set; } = string.Empty;
    public ColumnDto Column { get; set; } = new();
}

public class SqlTextResult
{
    public string Sql { get; set; } = string.Empty;
}
