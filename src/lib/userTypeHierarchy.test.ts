import { describe, it, expect } from 'vitest';
import {
  getAllowedUserTypesToCreate,
  getDefaultUserTypeForCreation,
  getAllUserTypeOptions
} from './userTypeHierarchy';

describe('userTypeHierarchy', () => {
  describe('getAllowedUserTypesToCreate', () => {
    it('admin can create all types (master)', () => {
      const allowed = getAllowedUserTypesToCreate('admin');
      const values = allowed.map(t => t.value);

      expect(values).toContain('admin');
      expect(values).toContain('associacao');
      expect(values).toContain('associado');
      expect(values).toContain('franquia');
      expect(values).toContain('franqueado');
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
      expect(allowed.length).toBe(7);
    });

    it('associacao can create associado and motorista only', () => {
      const allowed = getAllowedUserTypesToCreate('associacao');
      const values = allowed.map(t => t.value);

      expect(values).toContain('associado');
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(values).not.toContain('associacao');
      expect(values).not.toContain('franquia');
      expect(values).not.toContain('franqueado');
      expect(values).not.toContain('frotista');
      expect(allowed.length).toBe(2);
    });

    it('associado cannot create anyone', () => {
      const allowed = getAllowedUserTypesToCreate('associado');
      expect(allowed.length).toBe(0);
    });

    it('franquia can create franqueado and motorista only', () => {
      const allowed = getAllowedUserTypesToCreate('franquia');
      const values = allowed.map(t => t.value);

      expect(values).toContain('franqueado');
      expect(values).toContain('motorista');
      expect(values).not.toContain('admin');
      expect(values).not.toContain('associacao');
      expect(values).not.toContain('associado');
      expect(values).not.toContain('franquia');
      expect(values).not.toContain('frotista');
      expect(allowed.length).toBe(2);
    });

    it('franqueado cannot create anyone', () => {
      const allowed = getAllowedUserTypesToCreate('franqueado');
      expect(allowed.length).toBe(0);
    });

    it('frotista can only create motorista', () => {
      const allowed = getAllowedUserTypesToCreate('frotista');
      const values = allowed.map(t => t.value);

      expect(values).toContain('motorista');
      expect(allowed.length).toBe(1);
    });

    it('motorista cannot create anyone', () => {
      const allowed = getAllowedUserTypesToCreate('motorista');
      expect(allowed.length).toBe(0);
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

    it('returns motorista as default for franquia', () => {
      expect(getDefaultUserTypeForCreation('franquia')).toBe('motorista');
    });

    it('returns motorista as default for frotista', () => {
      expect(getDefaultUserTypeForCreation('frotista')).toBe('motorista');
    });

    it('returns motorista for undefined user type', () => {
      expect(getDefaultUserTypeForCreation(undefined)).toBe('motorista');
    });
  });

  describe('getAllUserTypeOptions', () => {
    it('returns all 7 user types', () => {
      const options = getAllUserTypeOptions();
      expect(options.length).toBe(7);
    });

    it('includes all user type values', () => {
      const options = getAllUserTypeOptions();
      const values = options.map(o => o.value);

      expect(values).toContain('admin');
      expect(values).toContain('associacao');
      expect(values).toContain('associado');
      expect(values).toContain('franquia');
      expect(values).toContain('franqueado');
      expect(values).toContain('frotista');
      expect(values).toContain('motorista');
    });

    it('has proper labels for each type', () => {
      const options = getAllUserTypeOptions();
      const labelMap = Object.fromEntries(options.map(o => [o.value, o.label]));

      expect(labelMap['admin']).toBe('Administrador');
      expect(labelMap['associacao']).toBe('Associação');
      expect(labelMap['associado']).toBe('Associado');
      expect(labelMap['franquia']).toBe('Franquia');
      expect(labelMap['franqueado']).toBe('Franqueado');
      expect(labelMap['frotista']).toBe('Frotista');
      expect(labelMap['motorista']).toBe('Motorista');
    });
  });

  describe('hierarchy validation scenarios', () => {
    it('only admin can create admin users', () => {
      const allTypes = ['admin', 'associacao', 'associado', 'franquia', 'franqueado', 'frotista', 'motorista'] as const;

      allTypes.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType);
        const values = allowed.map(t => t.value);
        if (userType === 'admin') {
          expect(values).toContain('admin');
        } else {
          expect(values).not.toContain('admin');
        }
      });
    });

    it('only admin can create associacao', () => {
      const canCreate = ['admin'];
      const cannotCreate = ['associacao', 'associado', 'franquia', 'franqueado', 'frotista', 'motorista'];

      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('associacao');
      });

      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('associacao');
      });
    });

    it('only admin and associacao can create associado', () => {
      const canCreate = ['admin', 'associacao'];
      const cannotCreate = ['associado', 'franquia', 'franqueado', 'frotista', 'motorista'];

      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('associado');
      });

      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('associado');
      });
    });

    it('only admin can create franquia', () => {
      const canCreate = ['admin'];
      const cannotCreate = ['associacao', 'associado', 'franquia', 'franqueado', 'frotista', 'motorista'];

      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('franquia');
      });

      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('franquia');
      });
    });

    it('only admin and franquia can create franqueado', () => {
      const canCreate = ['admin', 'franquia'];
      const cannotCreate = ['associacao', 'associado', 'franqueado', 'frotista', 'motorista'];

      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('franqueado');
      });

      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('franqueado');
      });
    });

    it('admin, associacao, franquia, and frotista can create motorista', () => {
      const canCreate = ['admin', 'associacao', 'franquia', 'frotista'];
      const cannotCreate = ['associado', 'franqueado', 'motorista'];

      canCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).toContain('motorista');
      });

      cannotCreate.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.map(t => t.value)).not.toContain('motorista');
      });
    });

    it('associado, franqueado, and motorista cannot create anyone', () => {
      const readOnlyTypes = ['associado', 'franqueado', 'motorista'];

      readOnlyTypes.forEach(userType => {
        const allowed = getAllowedUserTypesToCreate(userType as any);
        expect(allowed.length).toBe(0);
      });
    });
  });
});
