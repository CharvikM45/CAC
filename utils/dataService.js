import AsyncStorage from '@react-native-async-storage/async-storage';

// CSV data parsing utility
export const parseCSVData = (csvText) => {
  const lines = csvText.split('\n');
  const headers = parseCSVLine(lines[0]);
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index]?.trim() || '';
      });
      data.push(row);
    }
  }
  return data;
};

// Helper function to parse CSV line handling quoted fields
const parseCSVLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};

// User data management
export const saveUserData = async (userData) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error saving user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Favorites management
export const saveFavorites = async (favorites) => {
  try {
    await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
  } catch (error) {
    console.error('Error saving favorites:', error);
  }
};

export const getFavorites = async () => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

export const addToFavorites = async (material) => {
  try {
    const favorites = await getFavorites();
    const isAlreadyFavorite = favorites.some(fav => fav['Material Name'] === material['Material Name']);
    
    if (!isAlreadyFavorite) {
      const newFavorites = [...favorites, material];
      await saveFavorites(newFavorites);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
};

export const removeFromFavorites = async (materialName) => {
  try {
    const favorites = await getFavorites();
    const newFavorites = favorites.filter(fav => fav['Material Name'] !== materialName);
    await saveFavorites(newFavorites);
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
};
