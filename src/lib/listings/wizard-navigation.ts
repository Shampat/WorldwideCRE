export function getWizardNextPath(
  normalNextPath: string,
  returnTo: string | null
) {
  if (returnTo === 'review') {
    return '/dashboard/listings/new/review'
  }

  return normalNextPath
}
