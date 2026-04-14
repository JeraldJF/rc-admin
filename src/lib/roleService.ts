/**
 * Role Service - Fetches employee role and osid from Registry API
 * Replaces direct database access with proper API calls
 */

interface RoleLookupResult {
  role: string;
  osid: string | null;
}

/**
 * Looks up employee role and osid by email using Registry API
 * Falls back to searching by personalIdentification for numeric IDs
 */
export async function lookupEmployeeRole(email: string): Promise<RoleLookupResult> {
  const defaultResult: RoleLookupResult = { role: 'employee', osid: null };

  if (!email || email === 'unknown') {
    return defaultResult;
  }

  try {
    // First attempt: search by email in contactDetails
    const searchRes = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/registry/api/v1/Employee/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          "contactDetails": {
            "email": { "eq": email }
          }
        }
      })
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const employees = searchData?.Employee || searchData?.data || [];

      if (employees.length > 0) {
        const employee = employees[0];
        const role = employee.systemDetails?.role || 'employee';
        const osid = employee.osid || employee.id || null;

        console.log('[roleService] Found employee by email:', { email, role, osid });
        return { role: role.toLowerCase(), osid };
      }
    }

    // Second attempt: if email looks like numeric ID with @rc.local, search by personalIdentification
    if (email.includes('@')) {
      const personalId = email.replace(/@.*$/, ''); // Strip domain: 81272727841@rc.local → 81272727841

      if (/^\d+$/.test(personalId)) {
        const searchRes2 = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/registry/api/v1/Employee/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filters: {
              "personalIdentification": { "eq": personalId }
            }
          })
        });

        if (searchRes2.ok) {
          const searchData2 = await searchRes2.json();
          const employees2 = searchData2?.Employee || searchData2?.data || [];

          if (employees2.length > 0) {
            const employee = employees2[0];
            const role = employee.systemDetails?.role || 'employee';
            const osid = employee.osid || employee.id || null;

            console.log('[roleService] Found employee by personalIdentification:', { personalId, role, osid });
            return { role: role.toLowerCase(), osid };
          }
        }
      }
    }

    console.log('[roleService] No employee found for:', email);
    return defaultResult;
  } catch (err) {
    console.error('[roleService] Error looking up role:', err);
    return defaultResult;
  }
}
