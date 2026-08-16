using DatabaseDictionary.Core.Dtos;

namespace DatabaseDictionary.Core.Interfaces;

public interface IProgramUsageRepository
{
    Task<List<ProgramUsageDto>> GetByHeaderIdAsync(int headerId);

    /// <summary>Replaces the full program-usage list for a header (delete-all-then-insert) in one transaction.</summary>
    Task ReplaceAllAsync(int headerId, List<ProgramUsageDto> items);

    Task<bool> HeaderExistsAsync(int headerId);
}
