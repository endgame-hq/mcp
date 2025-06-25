/**
 * Finds an organization by name from an organizations array.
 * Used to resolve organization names to actual MongoDB ObjectIds for API calls.
 *
 * @param {object[]} organizations - Array of organization objects
 * @param {string} orgName - Organization name to find
 * @returns {object} Organization object with _id field
 * @throws {Error} If organization is not found or user doesn't have access
 */
export function findOrgByName(organizations, orgName) {
  if (!organizations || !Array.isArray(organizations)) {
    throw new Error('Invalid organizations array provided');
  }

  const org = organizations.find(org => org.name === orgName);

  if (!org) {
    throw new Error(
      `Organization "${orgName}" does not exist or you don't have access to it. ` +
        `Available organizations: ${organizations.map(o => o.name).join(', ')}`
    );
  }

  return org;
}
