import { useQuery } from "reactish-query";
import {
  fetchPackageDownloads,
  type PackageDownloadQuery,
} from "../api/npmDownloads";

export function usePackageDownloads(query: PackageDownloadQuery, enabled: boolean) {
  return useQuery({
    queryKey: ["package-downloads", query] as const,
    queryFn: ({ queryKey: [, request] }) => fetchPackageDownloads(request),
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
