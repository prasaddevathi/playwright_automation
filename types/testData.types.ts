export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'Standard User' | 'Read Only';
}

export interface Credentials {
  username: string;
  password: string;
}
