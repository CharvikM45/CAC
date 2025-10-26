import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { generateGeminiImageAnalysis } from '../utils/geminiClient';
// import MaterialCard from '../components/MaterialCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ImageDetectionScreen = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showCamera, setShowCamera] = useState(false);

  const takePicture = async () => {
    if (cameraRef) {
      try {
        const photo = await cameraRef.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setCapturedImage(photo);
        setShowCamera(false);
        await analyzeImage(photo.uri, photo.base64);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
        console.error('Camera error:', error);
      }
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        const photo = result.assets[0];
        setCapturedImage(photo);
        await analyzeImage(photo.uri, photo.base64);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from gallery');
      console.error('Gallery error:', error);
    }
  };

  const analyzeImage = async (imageUri, base64Image) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Create a comprehensive prompt for material identification
      const systemPrompt = `You are an expert materials scientist and sustainability consultant. Your task is to analyze images of materials and provide detailed information about their properties and suggest sustainable alternatives.

      When analyzing an image, provide your response in the following JSON format:
      {
        "identifiedMaterial": {
          "name": "Material name",
          "type": "Material type (Polymer, Composite, Metal, etc.)",
          "description": "Brief description of the material",
          "properties": {
            "tensileStrength": "value in MPa",
            "compressiveStrength": "value in MPa", 
            "elasticModulus": "value in GPa",
            "density": "value in g/cm³",
            "thermalConductivity": "value in W/mK",
            "corrosionResistance": "rating 1-10",
            "formability": "rating 1-10",
            "cost": "estimated cost $/kg",
            "biodegradability": "percentage"
          }
        },
        "sustainableAlternatives": [
          {
            "name": "Alternative material name",
            "type": "Material type",
            "description": "Why this is more sustainable",
            "properties": {
              "tensileStrength": "value in MPa",
              "compressiveStrength": "value in MPa",
              "elasticModulus": "value in GPa", 
              "density": "value in g/cm³",
              "thermalConductivity": "value in W/mK",
              "corrosionResistance": "rating 1-10",
              "formability": "rating 1-10",
              "cost": "estimated cost $/kg",
              "biodegradability": "percentage"
            },
            "sustainabilityBenefits": ["benefit 1", "benefit 2", "benefit 3"]
          }
        ],
        "analysisNotes": "Additional insights about the material and recommendations"
      }

      Focus on identifying common materials like plastics, metals, composites, textiles, and suggest biodegradable, recyclable, or renewable alternatives when possible.`;

      const userPrompt = `Please analyze this image and identify the material(s) visible. Provide detailed information about the material properties and suggest sustainable alternatives. Consider the environmental impact and suggest materials that are biodegradable, recyclable, or made from renewable resources.`;

      // Use Gemini's image analysis capabilities
      const response = await generateGeminiImageAnalysis(
        userPrompt,
        systemPrompt,
        base64Image
      );

      // Parse the JSON response
      try {
        const parsedResult = JSON.parse(response);
        setAnalysisResult(parsedResult);
      } catch (parseError) {
        // If JSON parsing fails, create a structured response from the text
        setAnalysisResult({
          identifiedMaterial: {
            name: "Material Analysis",
            type: "Unknown",
            description: response.substring(0, 200) + "...",
            properties: {
              tensileStrength: "N/A",
              compressiveStrength: "N/A",
              elasticModulus: "N/A",
              density: "N/A",
              thermalConductivity: "N/A",
              corrosionResistance: "N/A",
              formability: "N/A",
              cost: "N/A",
              biodegradability: "N/A"
            }
          },
          sustainableAlternatives: [],
          analysisNotes: response
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
      
      // If it's an API key error, provide a helpful message and mock analysis
      if (error.message.includes('API key') || error.message.includes('permission')) {
        Alert.alert(
          'API Key Required', 
          'Gemini API key is not configured. Using mock analysis for demonstration.',
          [{ text: 'OK' }]
        );
        
        // Provide a mock analysis for demonstration
        setAnalysisResult({
          identifiedMaterial: {
            name: "Sample Material",
            type: "Polymer",
            description: "This appears to be a plastic material commonly used in packaging.",
            properties: {
              tensileStrength: "25-35 MPa",
              compressiveStrength: "15-25 MPa",
              elasticModulus: "2-3 GPa",
              density: "0.9-1.2 g/cm³",
              thermalConductivity: "0.1-0.3 W/mK",
              corrosionResistance: "7/10",
              formability: "8/10",
              cost: "$2-4/kg",
              biodegradability: "5%"
            }
          },
          sustainableAlternatives: [
            {
              name: "PLA (Polylactic Acid)",
              type: "Biodegradable Polymer",
              description: "Made from renewable resources like corn starch, fully biodegradable",
              properties: {
                tensileStrength: "50-70 MPa",
                compressiveStrength: "30-50 MPa",
                elasticModulus: "3-4 GPa",
                density: "1.2-1.3 g/cm³",
                thermalConductivity: "0.1-0.2 W/mK",
                corrosionResistance: "6/10",
                formability: "7/10",
                cost: "$3-6/kg",
                biodegradability: "95%"
              },
              sustainabilityBenefits: [
                "Fully biodegradable",
                "Made from renewable resources",
                "Lower carbon footprint",
                "Compostable in industrial facilities"
              ]
            }
          ],
          analysisNotes: "This is a mock analysis for demonstration purposes. To get real AI analysis, please configure a valid Gemini API key."
        });
      } else {
        Alert.alert('Error', `Failed to analyze image: ${error.message}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
  };

  const renderCamera = () => {
    if (!showCamera) return null;

    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          ref={(ref) => setCameraRef(ref)}
        >
          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCamera(false)}
            >
              <Ionicons name="close" size={30} color="white" />
            </TouchableOpacity>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </View>
        </CameraView>
      </View>
    );
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    return (
      <ScrollView style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Analysis Results</Text>
          <TouchableOpacity onPress={resetAnalysis} style={styles.resetButton}>
            <Ionicons name="refresh" size={20} color={Colors.primary} />
            <Text style={styles.resetButtonText}>New Analysis</Text>
          </TouchableOpacity>
        </View>

        {/* Identified Material */}
        <View style={styles.materialSection}>
          <Text style={styles.sectionTitle}>Identified Material</Text>
          <View style={styles.materialCard}>
            <Text style={styles.materialName}>{analysisResult.identifiedMaterial.name}</Text>
            <Text style={styles.materialType}>{analysisResult.identifiedMaterial.type}</Text>
            <Text style={styles.materialDescription}>{analysisResult.identifiedMaterial.description}</Text>
          </View>
        </View>

        {/* Sustainable Alternatives */}
        {analysisResult.sustainableAlternatives && analysisResult.sustainableAlternatives.length > 0 && (
          <View style={styles.alternativesSection}>
            <Text style={styles.sectionTitle}>Sustainable Alternatives</Text>
            {analysisResult.sustainableAlternatives.map((alternative, index) => (
              <View key={index} style={styles.alternativeCard}>
                <Text style={styles.alternativeName}>{alternative.name}</Text>
                <Text style={styles.alternativeType}>{alternative.type}</Text>
                <Text style={styles.alternativeDescription}>{alternative.description}</Text>
                
                {alternative.sustainabilityBenefits && (
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsTitle}>Sustainability Benefits:</Text>
                    {alternative.sustainabilityBenefits.map((benefit, benefitIndex) => (
                      <Text key={benefitIndex} style={styles.benefitItem}>• {benefit}</Text>
                    ))}
                  </View>
                )}

                <View style={styles.materialCard}>
                  <Text style={styles.materialName}>{alternative.name}</Text>
                  <Text style={styles.materialType}>{alternative.type}</Text>
                  <Text style={styles.materialDescription}>{alternative.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Analysis Notes */}
        {analysisResult.analysisNotes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Additional Insights</Text>
            <Text style={styles.notesText}>{analysisResult.analysisNotes}</Text>
          </View>
        )}
      </ScrollView>
    );
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera access is required for material detection</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderCamera()}
      
      {!showCamera && (
        <ScrollView style={styles.content}>
        {/* App Bar */}
        <View style={styles.appBar}>
          <Text style={styles.appBarTitle}>Material Detection</Text>
          <Text style={styles.appBarSubtitle}>Identify materials and discover sustainable alternatives</Text>
        </View>

          {capturedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.analyzingText}>Analyzing material...</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowCamera(true)}
              >
                <Ionicons name="camera" size={40} color="white" />
                <Text style={styles.actionButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.galleryButton]}
                onPress={pickImageFromGallery}
              >
                <Ionicons name="images" size={40} color="white" />
                <Text style={styles.actionButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderAnalysisResult()}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  appBar: {
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 140,
  },
  galleryButton: {
    backgroundColor: Colors.secondary,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  cameraControls: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  capturedImage: {
    width: screenWidth - 40,
    height: 250,
    borderRadius: 15,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  resultContainer: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  materialSection: {
    marginBottom: 25,
  },
  alternativesSection: {
    marginBottom: 25,
  },
  notesSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
  },
  alternativeCard: {
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alternativeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  alternativeType: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  alternativeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  benefitsContainer: {
    marginBottom: 15,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignSelf: 'center',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  materialCard: {
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  materialName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  materialType: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  materialDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default ImageDetectionScreen;
