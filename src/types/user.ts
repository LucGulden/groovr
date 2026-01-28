export interface User {
  uid: string;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  bio?: string;
}