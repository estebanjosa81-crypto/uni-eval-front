export function getEvalBasePath(pathname: string): string {
  return pathname.startsWith("/director-programa")
    ? "/director-programa/eval"
    : "/docente/eval";
}
