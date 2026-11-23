import { Redirect } from "wouter";

// Lien cassé dans l'application : retour à la home (la langue est choisie là-bas).
export default function NotFound() {
  return <Redirect to="/" />;
}
