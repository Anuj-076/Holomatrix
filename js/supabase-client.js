/* Creates the Supabase client (window.sb) and a small Auth helper (window.Auth) */
(function () {
  if (!window.supabase || !window.HOLO) {
    console.error('Supabase library or config missing.');
    return;
  }

  window.sb = window.supabase.createClient(HOLO.SUPABASE_URL, HOLO.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  window.Auth = {
    async session() {
      const { data } = await sb.auth.getSession();
      return data.session || null;
    },

    // Returns null if logged out, otherwise user + roles + permission checker
    async access() {
      const s = await this.session();
      if (!s) return null;

      const { data } = await sb
        .from('user_roles')
        .select('roles(name,color,position,permissions)')
        .eq('user_id', s.user.id);

      const roles = (data || []).map(r => r.roles).filter(Boolean);
      const perms = new Set(roles.flatMap(r => r.permissions || []));
      const isAdmin = perms.has('administrator');

      return {
        user: s.user,
        roles,
        perms,
        isAdmin,
        isStaff: roles.length > 0,
        can: p => isAdmin || perms.has(p)
      };
    },

    async signOut() {
      await sb.auth.signOut();
      window.location.href = '/';
    }
  };
})();
