using DatabaseDictionary.Core.Dtos;

namespace DatabaseDictionary.Core.Interfaces;

public interface ISchemaInspector
{
    Task<SchemaCompareResult> GetActualColumnsAsync(SchemaCompareRequest request);
}
