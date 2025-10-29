import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addToFavorites, removeFromFavorites, getFavorites } from '../utils/dataService';
import { materialsData } from '../data/materialsData';
import { Colors } from '../constants/colors';
import MaterialCard from '../components/MaterialCard';
import MaterialDetailModal from '../components/MaterialDetailModal';
import CompareModal from '../components/CompareModal';
import DropdownFilter from '../components/DropdownFilter';
import RangeDropdown from '../components/RangeDropdown';
import ConnectionSelectorModal from '../components/ConnectionSelectorModal';
import ProfileButton from '../components/ProfileButton';
import FavoritesModal from '../components/FavoritesModal';
import InnovationsModal from '../components/InnovationsModal';
import { getInnovationOfTheDay } from '../data/innovations';
import socketService from '../utils/socketService';

const HomeScreen = ({ userData, navigation }) => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showConnectionSelector, setShowConnectionSelector] = useState(false);
  const [materialToShare, setMaterialToShare] = useState(null);
  const [showFavoritesModal, setShowFavoritesModal] = useState(false);
  const [showInnovationsModal, setShowInnovationsModal] = useState(false);
  const [todayInnovation, setTodayInnovation] = useState(null);
  const [filters, setFilters] = useState({
    materialType: '',
    tensileStrength: '',
    compressiveStrength: '',
    elasticModulus: '',
    toughness: '',
    hardness: '',
    fatigueResistance: '',
    density: '',
    thermalConductivity: '',
    electricalConductivity: '',
    corrosionResistance: '',
    formability: '',
    scalability: '',
    cost: '',
    availability: '',
    energyEfficiency: '',
    biodegradability: '',
  });

  useEffect(() => {
    loadMaterials();
    loadFavorites();
    setTodayInnovation(getInnovationOfTheDay());
  }, []);

  useEffect(() => {
    applyFilters();
  }, [materials, searchQuery, filters]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      // Load materials data directly from JavaScript module
      setMaterials(materialsData);
      setFilteredMaterials(materialsData);
    } catch (error) {
      console.error('Error loading materials:', error);
      Alert.alert('Error', 'Failed to load materials data');
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavorites(favs.map(fav => fav['Material Name']));
  };

  const applyFilters = () => {
    let filtered = [...materials];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(material =>
        material['Material Name'].toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply material type filter
    if (filters.materialType) {
      filtered = filtered.filter(material =>
        material['Material Type'] === filters.materialType
      );
    }

    // Apply availability filter
    if (filters.availability) {
      filtered = filtered.filter(material =>
        material['Availability'] === filters.availability
      );
    }

    // Apply range filters
    const rangeFilters = [
      'tensileStrength', 'compressiveStrength', 'elasticModulus', 'toughness',
      'hardness', 'fatigueResistance', 'density', 'thermalConductivity',
      'electricalConductivity', 'corrosionResistance', 'formability',
      'scalability', 'energyEfficiency', 'biodegradability', 'cost'
    ];

    rangeFilters.forEach(filterKey => {
      if (filters[filterKey]) {
        filtered = filtered.filter(material => {
          const propertyKey = getPropertyKey(filterKey);
          const value = parseFloat(material[propertyKey]);
          return checkRangeFilter(value, filters[filterKey]);
        });
      }
    });

    setFilteredMaterials(filtered);
  };

  const getPropertyKey = (filterKey) => {
    const mapping = {
      'tensileStrength': 'Tensile Strength (MPa)',
      'compressiveStrength': 'Compressive Strength (MPa)',
      'elasticModulus': 'Elastic Modulus (GPa)',
      'toughness': 'Toughness (MJ/m³)',
      'hardness': 'Hardness (Shore D)',
      'fatigueResistance': 'Fatigue Resistance (Cycles)',
      'density': 'Density (g/cm³)',
      'thermalConductivity': 'Thermal Conductivity (W/mK)',
      'electricalConductivity': 'Electrical Conductivity (S/m)',
      'corrosionResistance': 'Corrosion Resistance (1–10)',
      'formability': 'Formability/Malleability (1–10)',
      'scalability': 'Scalability (1–10)',
      'energyEfficiency': 'Energy Efficiency (1–10)',
      'biodegradability': 'Biodegradability (%)',
      'cost': 'Cost ($/kg)',
    };
    return mapping[filterKey] || filterKey;
  };

  const checkRangeFilter = (value, range) => {
    if (isNaN(value) || !range) return true;
    
    if (range.includes('-')) {
      const [min, max] = range.split('-').map(v => parseFloat(v.replace(/[^\d.-]/g, '')));
      return value >= min && value <= max;
    } else if (range.includes('+')) {
      const min = parseFloat(range.replace(/[^\d.-]/g, ''));
      return value >= min;
    } else if (range.includes('Under')) {
      const max = parseFloat(range.replace(/[^\d.-]/g, ''));
      return value < max;
    }
    return true;
  };

  const handleToggleFavorite = async (material, isFavorite) => {
    try {
      if (isFavorite) {
        await removeFromFavorites(material['Material Name']);
        setFavorites(prev => prev.filter(name => name !== material['Material Name']));
        Alert.alert('Removed', `${material['Material Name']} removed from favorites`);
      } else {
        const success = await addToFavorites(material);
        if (success) {
          setFavorites(prev => [...prev, material['Material Name']]);
          Alert.alert('Added to Favorites', `${material['Material Name']} has been added to your favorites!`);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  const clearFilters = () => {
    setFilters({
      materialType: '',
      tensileStrength: '',
      compressiveStrength: '',
      elasticModulus: '',
      toughness: '',
      hardness: '',
      fatigueResistance: '',
      density: '',
      thermalConductivity: '',
      electricalConductivity: '',
      corrosionResistance: '',
      formability: '',
      scalability: '',
      cost: '',
      availability: '',
      energyEfficiency: '',
      biodegradability: '',
    });
    setSearchQuery('');
  };

  const handleMaterialPress = (material) => {
    setSelectedMaterial(material);
  };

  const handleCloseModal = () => {
    setSelectedMaterial(null);
  };

  const handleToggleCompare = (material) => {
    console.log('handleToggleCompare called for:', material['Material Name']);
    setSelectedForCompare(prev => {
      const isSelected = prev.some(m => m['Material Name'] === material['Material Name']);
      console.log('Is currently selected:', isSelected);
      if (isSelected) {
        const newSelection = prev.filter(m => m['Material Name'] !== material['Material Name']);
        console.log('Removing from selection, new count:', newSelection.length);
        return newSelection;
      } else {
        if (prev.length >= 3) {
          Alert.alert('Limit Reached', 'You can compare up to 3 materials at once.');
          return prev;
        }
        const newSelection = [...prev, material];
        console.log('Adding to selection, new count:', newSelection.length);
        return newSelection;
      }
    });
  };

  const handleShareMaterial = (material) => {
    setMaterialToShare(material);
    setShowConnectionSelector(true);
  };

  const handleSelectConnection = async (connection) => {
    try {
      const conversationId = [userData.id, connection.id].sort().join('-');
      const messageContent = `Shared material: ${materialToShare['Material Name']}`;
      
      console.log('Sharing material:', {
        conversationId,
        material: materialToShare,
        type: 'material',
        senderId: userData.id,
        receiverId: connection.id
      });
      
      // Send the material message
      socketService.sendMessage(
        conversationId,
        messageContent,
        userData.id,
        connection.id,
        'material',
        materialToShare
      );

      Alert.alert(
        'Material Shared',
        `"${materialToShare['Material Name']}" has been shared with ${connection.name}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error sharing material:', error);
      Alert.alert('Error', 'Failed to share material. Please try again.');
    }
  };

  const handleCompareMaterials = () => {
    console.log('handleCompareMaterials called with:', selectedForCompare.length, 'materials');
    console.log('Selected materials:', selectedForCompare.map(m => m['Material Name']));
    
    if (selectedForCompare.length < 2) {
      Alert.alert('Selection Required', 'Please select at least 2 materials to compare.');
      return;
    }
    console.log('Setting showCompareModal to true');
    setShowCompareModal(true);
  };

  const handleCloseCompareModal = () => {
    setShowCompareModal(false);
  };

  const renderMaterialCard = ({ item }) => (
    <MaterialCard
      material={item}
      isFavorite={favorites.includes(item['Material Name'])}
      onToggleFavorite={handleToggleFavorite}
      onPress={handleMaterialPress}
      isSelectedForCompare={selectedForCompare.some(m => m['Material Name'] === item['Material Name'])}
      onToggleCompare={handleToggleCompare}
      onShare={handleShareMaterial}
    />
  );

  // Get unique material types for dropdown
  const materialTypes = [...new Set(materials.map(m => m['Material Type']))].sort();
  const availabilityOptions = [...new Set(materials.map(m => m['Availability']))].sort();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Bar */}
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Text style={styles.appBarTitle}>Explore</Text>
            <Text style={styles.appBarSubtitle}>Discover sustainable materials</Text>
          </View>
          <View style={styles.appBarRight}>
            <TouchableOpacity 
              style={styles.innovationButton}
              onPress={() => setShowInnovationsModal(true)}
            >
              <Ionicons name="sparkles" size={22} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.favoritesButton}
              onPress={() => setShowFavoritesModal(true)}
            >
              <Ionicons name="heart" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <ProfileButton 
              onPress={() => navigation.navigate('Profile')}
              userData={userData}
            />
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search materials..."
            placeholderTextColor={Colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filters</Text>
            
            {/* Material Type and Availability */}
            <View style={styles.filterRow}>
              <DropdownFilter
                label="Material Type"
                value={filters.materialType}
                options={materialTypes}
                onSelect={(value) => setFilters(prev => ({ ...prev, materialType: value }))}
              />
              <DropdownFilter
                label="Availability"
                value={filters.availability}
                options={availabilityOptions}
                onSelect={(value) => setFilters(prev => ({ ...prev, availability: value }))}
              />
            </View>

            {/* Mechanical Properties */}
            <Text style={styles.filterSectionTitle}>Mechanical Properties</Text>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Tensile Strength"
                value={filters.tensileStrength}
                onSelect={(value) => setFilters(prev => ({ ...prev, tensileStrength: value }))}
                type="tensile"
              />
              <RangeDropdown
                label="Compressive Strength"
                value={filters.compressiveStrength}
                onSelect={(value) => setFilters(prev => ({ ...prev, compressiveStrength: value }))}
                type="compressive"
              />
            </View>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Elastic Modulus"
                value={filters.elasticModulus}
                onSelect={(value) => setFilters(prev => ({ ...prev, elasticModulus: value }))}
                type="elastic"
              />
              <RangeDropdown
                label="Toughness"
                value={filters.toughness}
                onSelect={(value) => setFilters(prev => ({ ...prev, toughness: value }))}
                type="toughness"
              />
            </View>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Hardness"
                value={filters.hardness}
                onSelect={(value) => setFilters(prev => ({ ...prev, hardness: value }))}
                type="hardness"
              />
              <RangeDropdown
                label="Fatigue Resistance"
                value={filters.fatigueResistance}
                onSelect={(value) => setFilters(prev => ({ ...prev, fatigueResistance: value }))}
                type="fatigue"
              />
            </View>

            {/* Physical Properties */}
            <Text style={styles.filterSectionTitle}>Physical Properties</Text>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Density"
                value={filters.density}
                onSelect={(value) => setFilters(prev => ({ ...prev, density: value }))}
                type="density"
              />
              <RangeDropdown
                label="Thermal Conductivity"
                value={filters.thermalConductivity}
                onSelect={(value) => setFilters(prev => ({ ...prev, thermalConductivity: value }))}
                type="thermal"
              />
            </View>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Electrical Conductivity"
                value={filters.electricalConductivity}
                onSelect={(value) => setFilters(prev => ({ ...prev, electricalConductivity: value }))}
                type="electrical"
              />
            </View>

            {/* Performance Ratings */}
            <Text style={styles.filterSectionTitle}>Performance Ratings</Text>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Corrosion Resistance"
                value={filters.corrosionResistance}
                onSelect={(value) => setFilters(prev => ({ ...prev, corrosionResistance: value }))}
                type="rating"
              />
              <RangeDropdown
                label="Formability"
                value={filters.formability}
                onSelect={(value) => setFilters(prev => ({ ...prev, formability: value }))}
                type="rating"
              />
            </View>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Scalability"
                value={filters.scalability}
                onSelect={(value) => setFilters(prev => ({ ...prev, scalability: value }))}
                type="rating"
              />
              <RangeDropdown
                label="Energy Efficiency"
                value={filters.energyEfficiency}
                onSelect={(value) => setFilters(prev => ({ ...prev, energyEfficiency: value }))}
                type="rating"
              />
            </View>

            {/* Economic & Environmental */}
            <Text style={styles.filterSectionTitle}>Economic & Environmental</Text>
            <View style={styles.filterRow}>
              <RangeDropdown
                label="Cost"
                value={filters.cost}
                onSelect={(value) => setFilters(prev => ({ ...prev, cost: value }))}
                type="cost"
              />
              <RangeDropdown
                label="Biodegradability"
                value={filters.biodegradability}
                onSelect={(value) => setFilters(prev => ({ ...prev, biodegradability: value }))}
                type="biodegradability"
              />
            </View>

            {/* Clear Button */}
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Text style={styles.clearButtonText}>Clear All Filters</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.resultsContainer}>
          <View style={styles.resultsRow}>
            <Text style={styles.resultsText}>
              {filteredMaterials.length} materials found
            </Text>
            {selectedForCompare.length > 0 && (
              <TouchableOpacity style={styles.compareButton} onPress={handleCompareMaterials}>
                <Text style={styles.compareButtonText}>
                  Compare ({selectedForCompare.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.materialsContainer}>
          {filteredMaterials.map((item) => (
            <MaterialCard
              key={item['Material Name']}
              material={item}
              isFavorite={favorites.includes(item['Material Name'])}
              onToggleFavorite={handleToggleFavorite}
              onPress={handleMaterialPress}
              isSelectedForCompare={selectedForCompare.some(m => m['Material Name'] === item['Material Name'])}
              onToggleCompare={handleToggleCompare}
              onShare={handleShareMaterial}
            />
          ))}
        </View>
      </ScrollView>

      <MaterialDetailModal
        visible={selectedMaterial !== null}
        material={selectedMaterial}
        onClose={handleCloseModal}
        isFavorite={selectedMaterial ? favorites.includes(selectedMaterial['Material Name']) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      <CompareModal
        visible={showCompareModal}
        materials={selectedForCompare}
        onClose={handleCloseCompareModal}
      />

      <ConnectionSelectorModal
        visible={showConnectionSelector}
        onClose={() => setShowConnectionSelector(false)}
        onSelectConnection={handleSelectConnection}
        currentUserId={userData.id}
        material={materialToShare}
      />

      <FavoritesModal
        visible={showFavoritesModal}
        onClose={() => setShowFavoritesModal(false)}
        userData={userData}
      />

      <InnovationsModal
        visible={showInnovationsModal}
        onClose={() => setShowInnovationsModal(false)}
        innovation={todayInnovation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Add padding for bottom navigation
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  appBarLeft: {
    flex: 1,
  },
  appBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoritesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  innovationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  appBarTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  appBarSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 20,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 18,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
  },
  filtersContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 16,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterInput: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  clearButton: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    marginTop: 16,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  resultsContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  compareButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  compareButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondary,
  },
  materialsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
});

export default HomeScreen;
