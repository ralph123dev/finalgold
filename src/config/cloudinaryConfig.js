// config/cloudinaryConfig.js
export const CLOUDINARY_CONFIG = {
  cloudName: 'demhlpk5q', // Remplacez par votre cloud name
//   apiKey: 'YOUR_API_KEY',       // Remplacez par votre API key
  uploadPreset: 'chat_media' // Remplacez par votre upload preset
};

// Fonction pour uploader un fichier vers Cloudinary
export const uploadToCloudinary = async (file, resourceType = 'auto') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  formData.append('cloud_name', CLOUDINARY_CONFIG.cloudName);
  
  // Définir le type de ressource (image, video, raw pour audio/documents)
  if (file.type.startsWith('video/')) {
    resourceType = 'video';
  } else if (file.type.startsWith('audio/')) {
    resourceType = 'video'; // Cloudinary traite l'audio comme video
  } else if (file.type.startsWith('image/')) {
    resourceType = 'image';
  } else {
    resourceType = 'raw'; // Pour les documents, etc.
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Erreur upload: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
      format: data.format
    };
  } catch (error) {
    console.error('Erreur upload Cloudinary:', error);
    throw error;
  }
};

// Fonction pour supprimer un fichier de Cloudinary (optionnel)
export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    // Cette fonction nécessiterait l'API signature côté serveur
    // Pour la suppression, il faut généralement passer par un backend
    console.log('Suppression à implémenter côté serveur:', publicId);
  } catch (error) {
    console.error('Erreur suppression Cloudinary:', error);
  }
};