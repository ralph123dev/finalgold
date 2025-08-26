// src/utils/countryUtils.js

/**
 * Récupère les informations sur le pays de l'utilisateur en essayant plusieurs APIs.
 * @returns {Promise<{country: string, countryCode: string}>} Un objet avec le nom et le code du pays.
 */
export const getUserCountryInfo = async () => {
  // Liste des APIs à essayer, dans l'ordre de préférence.
  // Elles ont des formats de réponse différents, que nous gérons ci-dessous.
  const apis = [
    { name: 'ipapi.co', url: 'https://ipapi.co/json/' },
    { name: 'ip-api.com', url: 'https://ip-api.com/json' }
  ];

  // On boucle sur chaque API et on s'arrête dès que l'une d'elles fonctionne.
  for (const api of apis) {
    try {
      console.log(`Tentative de géolocalisation avec ${api.name}...`);
      const response = await fetch(api.url);
      if (!response.ok) {
        // Si la réponse n'est pas bonne (ex: 403), on lève une erreur pour passer à l'API suivante.
        throw new Error(`Réponse réseau non OK: ${response.statusText}`);
      }
      
      const data = await response.json();
      let country, countryCode;

      // On traite la réponse spécifique à chaque API
      if (api.name === 'ipapi.co') {
        country = data.country_name;
        countryCode = data.country_code;
      } else if (api.name === 'ip-api.com') {
        country = data.country;
        countryCode = data.countryCode;
      }

      // Si on a trouvé des informations valides, on les retourne et on arrête la fonction.
      if (country && countryCode) {
        console.log(`Succès avec ${api.name}:`, { country, countryCode });
        return { country, countryCode };
      }
    } catch (error) {
      // Si une API échoue, on l'affiche en console et on continue simplement à la suivante.
      console.warn(`Échec avec ${api.name}:`, error.message);
    }
  }

  // Si la boucle se termine sans avoir retourné de résultat, toutes les APIs ont échoué.
  console.error("Impossible de récupérer les informations du pays après toutes les tentatives.");
  return { country: 'Inconnu', countryCode: 'XX' };
};

/**
 * Génère l'URL de l'API pour afficher le drapeau d'un pays.
 * @param {string} countryCode Le code du pays à deux lettres (ex: 'FR').
 * @returns {string} L'URL complète de l'image du drapeau, ou une chaîne vide en cas d'échec.
 */
export const getCountryFlag = (countryCode) => {
  if (!countryCode || countryCode === 'XX') {
    return ''; // Retourner une chaîne vide est plus sûr pour les attributs src des images
  }
  return `https://flagsapi.com/${countryCode.toUpperCase()}/flat/64.png`;
};