import { useQuery } from "reactish-query";
import { fetchAuthorDownloads, type AuthorDownloadQuery } from "../api/npmAuthors";

export function useAuthorDownloads(query: AuthorDownloadQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["author-downloads", query] as const,
    queryFn: ({ queryKey: [, request] }) => fetchAuthorDownloads(request),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
