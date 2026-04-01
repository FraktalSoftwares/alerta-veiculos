import { Database } from "@/integrations/supabase/types";

type UserType = Database["public"]["Enums"]["user_type"];

interface UserTypeOption {
  value: UserType;
  label: string;
}

// Define all user types with labels
const ALL_USER_TYPES: UserTypeOption[] = [
  { value: "admin", label: "Administrador" },
  { value: "associacao", label: "Associação" },
  { value: "associado", label: "Associado" },
  { value: "franquia", label: "Franquia" },
  { value: "franqueado", label: "Franqueado" },
  { value: "frotista", label: "Frotista" },
  { value: "motorista", label: "Motorista" },
];

// Define which user types each user type can create
const ALLOWED_CREATIONS: Record<UserType, UserType[]> = {
  admin: ["admin", "associacao", "associado", "franquia", "franqueado", "frotista", "motorista"],
  associacao: ["associado", "motorista"],
  associado: [],
  franquia: ["franqueado", "motorista"],
  franqueado: [],
  frotista: ["motorista"],
  motorista: [],
};

/**
 * Returns the list of user types that a given user type can create
 */
export function getAllowedUserTypesToCreate(currentUserType: UserType | undefined): UserTypeOption[] {
  if (!currentUserType) return [];
  
  const allowedTypes = ALLOWED_CREATIONS[currentUserType] || [];
  return ALL_USER_TYPES.filter(type => allowedTypes.includes(type.value));
}

/**
 * Returns all user type options (for display purposes)
 */
export function getAllUserTypeOptions(): UserTypeOption[] {
  return ALL_USER_TYPES;
}

/**
 * Gets the default user type for creation based on what the current user can create
 */
export function getDefaultUserTypeForCreation(currentUserType: UserType | undefined): UserType {
  const allowed = getAllowedUserTypesToCreate(currentUserType);
  // Return the last (lowest hierarchy) option as default
  return allowed.length > 0 ? allowed[allowed.length - 1].value : "motorista";
}
