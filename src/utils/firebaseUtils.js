import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  writeBatch,
  getDocs,
  serverTimestamp,
  where,
  addDoc
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll
} from 'firebase/storage';
import { db, storage } from '../firebase';

// Créer un utilisateur s'il n'existe pas (modifié pour accepter countryInfo)
export const createUserIfNeeded = async (pseudo, countryInfo = null) => {
  const userRef = doc(db, 'users', pseudo);
  const userSnap = await getDoc(userRef);
  
  const userData = {
    pseudo: pseudo,
    name: "",
    phone: "",
    country: countryInfo?.country || "",
    countryCode: countryInfo?.country_code || "",
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    connectionTime: serverTimestamp()
  };
  
  if (!userSnap.exists()) {
    await setDoc(userRef, userData);
  } else {
    // Mettre à jour lastSeen et connectionTime même si l'utilisateur existe déjà
    // Si l'utilisateur existait déjà mais n'avait pas de countryCode, on le met à jour
    const existingData = userSnap.data();
    const updates = {
      lastSeen: serverTimestamp(),
      connectionTime: serverTimestamp()
    };
    
    // Ajouter les informations de pays si elles n'existaient pas
    if (!existingData.countryCode && countryInfo) {
      updates.country = countryInfo.country;
      updates.countryCode = countryInfo.country_code;
    }
    
    await updateDoc(userRef, updates);
  }
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (pseudo, updates) => {
  const userRef = doc(db, 'users', pseudo);
  await updateDoc(userRef, {
    ...updates,
    lastSeen: serverTimestamp()
  });
};

// ===== FONCTIONS DE VÉRIFICATION =====

// Récupérer toutes les données de vérification
export const getVerifyData = async () => {
  try {
    console.log('Récupération des données de vérification...');
    const q = query(collection(db, 'verifyData'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const verifyList = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      console.log('Document trouvé:', docSnap.id, data);
      verifyList.push({ 
        id: docSnap.id, 
        ...data 
      });
    });
    
    console.log('Données récupérées:', verifyList);
    return verifyList;
  } catch (error) {
    console.error('Erreur lors de la récupération des données de vérification:', error);
    console.error('Code d\'erreur:', error.code);
    console.error('Message d\'erreur:', error.message);
    throw error;
  }
};

// Ajouter des données de vérification - VERSION CORRIGÉE
export const addVerifyData = async (verifyData) => {
  try {
    console.log('Ajout des données de vérification:', verifyData);
    
    // Vérification des données d'entrée
    if (!verifyData || !verifyData.name || !verifyData.country || !verifyData.phoneNumber) {
      throw new Error('Données manquantes: nom, pays ou numéro de téléphone');
    }

    // Utiliser addDoc au lieu de setDoc pour une génération automatique d'ID
    const verifyRef = collection(db, 'verifyData');
    
    const docData = {
      name: String(verifyData.name).trim(),
      country: String(verifyData.country).trim(),
      phoneNumber: String(verifyData.phoneNumber).trim(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    console.log('Données à sauvegarder:', docData);
    
    const docRef = await addDoc(verifyRef, docData);
    
    console.log('Document ajouté avec succès, ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erreur détaillée lors de l\'ajout des données de vérification:');
    console.error('- Code:', error.code);
    console.error('- Message:', error.message);
    console.error('- Stack:', error.stack);
    console.error('- Données reçues:', verifyData);
    
    // Relancer l'erreur avec plus d'informations
    throw new Error(`Erreur d'ajout: ${error.message}`);
  }
};

// Supprimer des données de vérification
export const deleteVerifyData = async (verifyId) => {
  try {
    console.log('Suppression des données de vérification, ID:', verifyId);
    
    if (!verifyId) {
      throw new Error('ID de vérification manquant');
    }

    const verifyRef = doc(db, 'verifyData', verifyId);
    await deleteDoc(verifyRef);
    console.log('Données supprimées avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression des données de vérification:', error);
    console.error('ID:', verifyId);
    throw error;
  }
};

// Mettre à jour des données de vérification
export const updateVerifyData = async (verifyId, updates) => {
  try {
    console.log('Mise à jour des données de vérification:', verifyId, updates);
    
    if (!verifyId) {
      throw new Error('ID de vérification manquant');
    }

    const verifyRef = doc(db, 'verifyData', verifyId);
    await updateDoc(verifyRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('Données mises à jour avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données de vérification:', error);
    throw error;
  }
};

// Écouter les données de vérification en temps réel - VERSION AMÉLIORÉE
export const listenToVerifyData = (callback) => {
  try {
    console.log('Initialisation de l\'écoute en temps réel des données de vérification');
    
    const q = query(collection(db, 'verifyData'), orderBy('createdAt', 'desc'));
    
    return onSnapshot(
      q, 
      (snapshot) => {
        console.log('Snapshot reçu, nombre de documents:', snapshot.size);
        const verifyList = [];
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          console.log('Document en temps réel:', docSnap.id, data);
          verifyList.push({ 
            id: docSnap.id, 
            ...data 
          });
        });
        
        console.log('Données en temps réel:', verifyList);
        callback(verifyList);
      },
      (error) => {
        console.error('Erreur dans l\'écoute en temps réel:', error);
        console.error('Code d\'erreur:', error.code);
        console.error('Message d\'erreur:', error.message);
        // Appeler le callback avec un tableau empty en cas d'erreur
        callback([]);
      }
    );
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'écoute:', error);
    // Retourner une fonction de nettoyage vide
    return () => {};
  }
};

// Fonction de test pour vérifier la connexion Firebase
export const testFirebaseConnection = async () => {
  try {
    console.log('Test de connexion Firebase...');
    
    // Tester la lecture
    const q = query(collection(db, 'verifyData'));
    const snapshot = await getDocs(q);
    console.log('Lecture réussie, nombre de documents:', snapshot.size);
    
    // Tester l'écriture avec un document temporaire
    const testRef = collection(db, 'verifyData');
    const testDoc = await addDoc(testRef, {
      name: 'Test',
      country: 'Test',
      phoneNumber: 'Test',
      createdAt: serverTimestamp(),
      isTest: true
    });
    console.log('Écriture réussie, ID du document test:', testDoc.id);
    
    // Supprimer le document test
    await deleteDoc(doc(db, 'verifyData', testDoc.id));
    console.log('Suppression réussie');
    
    return { success: true, message: 'Firebase fonctionne correctement' };
  } catch (error) {
    console.error('Erreur de connexion Firebase:', error);
    return { success: false, error: error.message };
  }
};

// ===== FIN DES FONCTIONS DE VÉRIFICATION =====

// Envoyer un message de groupe (modifié pour supporter les durées audio)
export const sendGroupMessage = async (from, type, text = "", mediaData = null, country = "", audioDuration = 0) => {
  const messagesRef = collection(db, 'groupMessages');
  const messageData = {
    from,
    type,
    text,
    country: country || "",
    createdAt: serverTimestamp()
  };

  // Ajouter les données du média si présent
  if (mediaData) {
    messageData.mediaUrl = mediaData.url;
    messageData.mediaInfo = {
      publicId: mediaData.publicId,
      resourceType: mediaData.resourceType,
      format: mediaData.format,
      fileName: mediaData.fileName,
      fileSize: mediaData.fileSize
    };
  }

  // Ajouter la durée audio si c'est un message audio
  if (type === 'audio' && audioDuration > 0) {
    messageData.audioDuration = audioDuration;
  }

  await setDoc(doc(messagesRef), messageData);
};

// Envoyer un message privé (modifié pour supporter les durées audio)
export const sendPrivateMessage = async (from, to, type, text = "", mediaData = null, audioDuration = 0) => {
  const messagesRef = collection(db, 'privateMessages');
  const messageData = {
    from,
    to,
    type,
    text,
    read: false,
    createdAt: serverTimestamp()
  };

  // Ajouter les données du média si présent
  if (mediaData) {
    messageData.mediaUrl = mediaData.url;
    messageData.mediaInfo = {
      publicId: mediaData.publicId,
      resourceType: mediaData.resourceType,
      format: mediaData.format,
      fileName: mediaData.fileName,
      fileSize: mediaData.fileSize
    };
  }

  // Ajouter la durée audio si c'est un message audio
  if (type === 'audio' && audioDuration > 0) {
    messageData.audioDuration = audioDuration;
  }

  await setDoc(doc(messagesRef), messageData);
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (currentUser, fromUser) => {
  try {
    const q = query(
      collection(db, 'privateMessages'),
      where('from', '==', fromUser),
      where('to', '==', currentUser),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.forEach((docSnapshot) => {
      batch.update(docSnapshot.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Erreur lors du marquage des messages comme lus:', error);
  }
};

// Import Cloudinary
import { uploadToCloudinary } from '../config/cloudinaryConfig';

// Uploader un fichier vers Cloudinary (modifié pour supporter Blob et File)
export const uploadFile = async (fileOrBlob, type, from, onProgress = null) => {
  try {
    let fileToUpload;
    
    // Si c'est un Blob (comme pour les enregistrements audio), le convertir en File
    if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
      const fileExtension = type === 'audio' ? 'webm' : 'bin';
      const fileName = type === 'audio' ? `audio_${Date.now()}.webm` : `file_${Date.now()}.${fileExtension}`;
      
      fileToUpload = new File([fileOrBlob], fileName, {
        type: fileOrBlob.type || (type === 'audio' ? 'audio/webm' : 'application/octet-stream'),
        lastModified: Date.now()
      });
    } else if (fileOrBlob instanceof File) {
      fileToUpload = fileOrBlob;
    } else {
      throw new Error('Le paramètre fileOrBlob doit être un File ou un Blob');
    }

    // Simuler le progress si une callback est fournie
    if (onProgress) {
      onProgress(25);
    }

    const result = await uploadToCloudinary(fileToUpload);
    
    if (onProgress) {
      onProgress(75);
    }

    const uploadResult = {
      url: result.url,
      publicId: result.publicId,
      resourceType: result.resourceType,
      format: result.format,
      fileName: fileToUpload.name,
      fileSize: fileToUpload.size,
      uploadedBy: from,
      uploadedAt: new Date().toISOString()
    };

    if (onProgress) {
      onProgress(100);
    }

    return uploadResult;
  } catch (error) {
    console.error('Erreur upload vers Cloudinary:', error);
    throw error;
  }
};

// Alternative: Uploader vers Firebase Storage (si vous préférez Firebase Storage)
export const uploadFileToFirebaseStorage = async (fileOrBlob, type, from, onProgress = null) => {
  try {
    let fileToUpload;
    let fileName;
    
    // Si c'est un Blob (comme pour les enregistrements audio), le convertir en File
    if (fileOrBlob instanceof Blob && !(fileOrBlob instanceof File)) {
      const fileExtension = type === 'audio' ? 'webm' : 'bin';
      fileName = type === 'audio' ? `audio_${Date.now()}.webm` : `file_${Date.now()}.${fileExtension}`;
      
      fileToUpload = new File([fileOrBlob], fileName, {
        type: fileOrBlob.type || (type === 'audio' ? 'audio/webm' : 'application/octet-stream'),
        lastModified: Date.now()
      });
    } else if (fileOrBlob instanceof File) {
      fileToUpload = fileOrBlob;
      fileName = fileToUpload.name;
    } else {
      throw new Error('Le paramètre fileOrBlob doit être un File ou un Blob');
    }

    // Créer une référence dans Firebase Storage
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `uploads/${type}s/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, storagePath);

    if (onProgress) {
      onProgress(25);
    }

    // Uploader le fichier
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    
    if (onProgress) {
      onProgress(75);
    }

    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (onProgress) {
      onProgress(100);
    }

    return {
      url: downloadURL,
      publicId: storagePath, // Utiliser le chemin comme publicId pour Firebase
      resourceType: type,
      format: fileName.split('.').pop() || 'unknown',
      fileName: fileName,
      fileSize: fileToUpload.size,
      uploadedBy: from,
      uploadedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erreur upload vers Firebase Storage:', error);
    throw error;
  }
};

// Purger toutes les données de l'application
export const purgeAllAppData = async () => {
  try {
    // Supprimer tous les documents Firestore (ajout de 'verifyData')
    const collections = ['users', 'groupMessages', 'privateMessages', 'verifyData'];
    const batch = writeBatch(db);

    for (const colName of collections) {
      const q = query(collection(db, colName));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
    }
    await batch.commit();

    // Supprimer tous les fichiers Storage
    const storageRef = ref(storage, 'uploads');
    const listResult = await listAll(storageRef);
    
    // Supprimer tous les fichiers récursivement
    const deleteFolder = async (folderRef) => {
      const listResult = await listAll(folderRef);
      
      // Supprimer tous les fichiers dans le dossier
      const fileDeletePromises = listResult.items.map(item => deleteObject(item));
      await Promise.all(fileDeletePromises);
      
      // Supprimer tous les sous-dossiers récursivement
      const folderDeletePromises = listResult.prefixes.map(prefix => deleteFolder(prefix));
      await Promise.all(folderDeletePromises);
    };
    
    await deleteFolder(storageRef);

    console.log('Purge completed successfully');
  } catch (error) {
    console.error('Error during purge:', error);
    alert('Erreur lors de la purge des données');
  }
};

// Écouter les utilisateurs en temps réel
export const listenToUsers = (callback) => {
  return onSnapshot(collection(db, 'users'), callback);
};

// Écouter les messages de groupe en temps réel
export const listenToGroupMessages = (callback) => {
  const q = query(collection(db, 'groupMessages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, callback);
};

// Écouter les messages privés en temps réel
export const listenToPrivateMessages = (currentUser, otherUser, callback) => {
  const q = query(
    collection(db, 'privateMessages'), 
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Si otherUser est null, on récupère tous les messages concernant currentUser
        if (!otherUser || 
            (data.from === currentUser && data.to === otherUser) || 
            (data.from === otherUser && data.to === currentUser)) {
          messages.push({ id: doc.id, ...data });
        }
      }
    });
    callback(messages);
  });
};

// Récupérer les informations d'un utilisateur
export const getUserInfo = async (pseudo) => {
  const userRef = doc(db, 'users', pseudo);
  const userSnap = await getDoc(userRef);
  return userSnap.exists() ? userSnap.data() : null;
};