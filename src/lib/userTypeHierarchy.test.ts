import { describe, it, expect } from 'vitest';
import { 
  getAllowedUserTypesToCreate, 
  getDefaultUserTypeForCreation,
  getAllUserTypeOptions 
} from './userTypeHierarchy';

describe('userTypeHierarchy', () => {
  describe('getAllowedUserTypesToCreate', () => {
    it('admin can create all types except admin', () => {
      const allowed = getAllowedUserTypesToCreate('admin');
      const values = allowed.map(t => t.value);
      
      expect(values).toContain('associacao');
      expect(values).toContain('franqueado');
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(allowed.length).toBe(4);
    });

    it('associacao can create franqueado, frotista, and motorista', () => {
      const allowed = getAllowedUserTypesToCreate('associacao');
      const values = allowed.map(t => t.value);
      
      expect(values).toContain('franqueado');
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(values).not.toContain('associacao');
      expect(allowed.length).toBe(3);
    });

    it('franqueado can create frotista and motorista', () => {
      const allowed = getAllowedUserTypesToCreate('franqueado');
      const values = allowed.map(t => t.value);
      
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(values).not.toContain('associacao');
      expect(values).not.toContain('franqueado');
      expect(allowed.length).toBe(2);
    });

    it('frotista can only create motorista', () => {
      const allowed = getAllowedUserTypesToCreate('frotista');
      const values = allowed.map(t => t.value);
      
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(values).not.toContain('associacao');
      expect(values).not.toContain('franqueado');
      expect(values).not.toContain('frotista');
      expect(allowed.length).toBe(1);
    });

    it('motorista can only create motorista', () => {
      const allowed = getAllowedUserTypesToCreate('motorista');
      const values = allowed.map(t => t.value);
      
      expect(values).toContain('motorista');
      expect(allowed.length).toBe(1);
    });

    it('returns empty array for undefined user type', () => {
      const allowed = getAllowedUserTypesToCreate(undefined);
      expect(allowed).toEqual([]);
    });
  });

  describe('getDefaultUserTypeForCreation', () => {
    it('returns motorista as default for admin', () => {
      expect(getDefaultUserTypeForCreation('admin')).toBe('motorista');
    });

    it('returns motorista as default for associacao', () => {
      expect(getDefaultUserTypeForCreation('associacao')).toBe('motorista');
    });

    it('returns motorista as default for franqueado', () => {
      expect(getDefaultUserTypeForCreation('franqueado')).toBe('motorista');
    });

    it('returns motorista as default for frotista', () => {
      expect(getDefaultUserTypeForCreation('frotista')).toBe('motorista');
    });

    it('returns motorista as default for motorista', () => {
      expect(getDefaultUserTypeForCreation('motorista')).toBe('motorista');
    });

    it('returns motorista for undefined user type', () => {
      expect(getDefaultUserTypeForCreation(undefined)).toBe('motorista');
    });
  });

  describe('getAllUserTypeOptions', () => {
    it('returns all 5 user types', () => {
      const options = getAllUserTypeOptions();
      expect(options.length).toBe(5);
    });

    it('includes all user type values', () => {
      const options = getAllUserTypeOptions();
      const values = options.map(o => o.value);
      
      expect(values).toContain('admin');
      expect(values).toContain('associacao');
      expect(values).toContain('franqueado');
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
    });

    it('has proper labels for each type', () => {
      const options = getAllUserTypeOptions();
      const labelMap = Object.fromEntries(options.map(o => [o.value, o.label]));
      
      expect(labelMap['admin']).toBe('Administrador');
      expect(labelMap['associacao']).toBe('Associação');
      expect(labelMap['franqueado']).toBe('Franqueado');
      expect(labelMap['frotista']).toBe('Frotista');
      expect(labelMap['motorista']).toBe('Motorista');
    });
  });

  describe('hierarchy validation scenarios', () => {
    it('no user type can create admin users', () => {
      const userTypes = ['admin', 'associacao', 'franqueado', 'frotista', 'motorista'] as const;
      
      userTypes.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType);
        const values = allowed.map(t => t.value);
        expect(values).not.toContain('admin');
      });
    });

    it('only admin can create associacao', () => {
      const canCreate = ['admin'];
      const cannotCreate = ['associacao', 'franqueado', 'frotista', 'motorista'];
      
      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('associacao');
      });
      
      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('associacao');
      });
    });

    it('only admin and associacao can create franqueado', () => {
      const canCreate = ['admin', 'associacao'];
      const cannotCreate = ['franqueado', 'frotista', 'motorista'];
      
      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('franqueado');
      });
      
      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('franqueado');
      });
    });

    it('admin, associacao, and franqueado can create frotista', () => {
      const canCreate = ['admin', 'associacao', 'franqueado'];
      const cannotCreate = ['frotista', 'motorista'];
      
      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('frotista');
      });
      
      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('frotista');
      });
    });

    it('everyone can create motorista', () => {
      const allTypes = ['admin', 'associacao', 'franqueado', 'frotista', 'motorista'];
      
      allTypes.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('motorista');
      });
    });
  });
});
