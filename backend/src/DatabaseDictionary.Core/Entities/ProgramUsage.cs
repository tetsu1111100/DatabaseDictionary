namespace DatabaseDictionary.Core.Entities;

public class ProgramUsage
{
    public int HeaderId { get; set; }
    public int SeqNo { get; set; }
    public string ProgramName { get; set; } = string.Empty;
    public string? Description { get; set; }
}
