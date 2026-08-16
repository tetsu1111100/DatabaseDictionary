namespace DatabaseDictionary.Core.Entities;

public class TableHeader
{
    public int HeaderId { get; set; }
    public string DatabaseName { get; set; } = string.Empty;
    public string DatabaseHost { get; set; } = string.Empty;
    public string ObjectType { get; set; } = string.Empty;
    public string ObjectName { get; set; } = string.Empty;
    public string? TableDescription { get; set; }
    public string? OtherDescription { get; set; }
    public string? Remark { get; set; }
    public string? ConnPort { get; set; }
    public string? ConnAccount { get; set; }
    public string? ConnPassword { get; set; }
    public bool UseWindowsAuth { get; set; }
}
