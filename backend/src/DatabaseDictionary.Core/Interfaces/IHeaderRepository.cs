using DatabaseDictionary.Core.Dtos;

namespace DatabaseDictionary.Core.Interfaces;

public interface IHeaderRepository
{
    Task<List<HeaderListItemDto>> SearchAsync(HeaderSearchQuery query);
    Task<HeaderDetailDto?> GetByIdAsync(int headerId);

    /// <summary>Returns true when another header already uses the same DatabaseHost+DatabaseName+ObjectName combination.</summary>
    Task<bool> ExistsDuplicateAsync(string databaseHost, string databaseName, string objectName, int? excludeHeaderId);

    /// <summary>Inserts header + columns in one transaction, returns the new HeaderId.</summary>
    Task<int> CreateAsync(HeaderDetailDto header);

    /// <summary>Updates header fields and replaces its columns (delete-all-then-insert) in one transaction.</summary>
    Task UpdateAsync(HeaderDetailDto header);

    /// <summary>Hard-deletes the header; columns and program usage rows cascade via FK ON DELETE CASCADE.</summary>
    Task DeleteAsync(int headerId);
}
