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
import { generateOpenAIImageAnalysis } from '../utils/openaiClient';
import ProfileButton from '../components/ProfileButton';

const { width: screenWidth } = Dimensions.get('window');

// Helper function to extract material information from text response
const extractMaterialInfoFromText = (text) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  let materialName = "Unknown Material";
  let materialType = "Unknown";
  let description = text.substring(0, 300) + "...";
  
  const materialKeywords = {
    'plastic': 'Polymer',
    'metal': 'Metal',
    'wood': 'Natural Material',
    'fabric': 'Textile',
    'glass': 'Ceramic',
    'ceramic': 'Ceramic',
    'composite': 'Composite',
    'rubber': 'Elastomer',
    'paper': 'Cellulose',
    'cardboard': 'Cellulose'
  };
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    for (const [keyword, type] of Object.entries(materialKeywords)) {
      if (lowerLine.includes(keyword)) {
        materialType = type;
        break;
      }
    }
    const words = line.split(' ');
    for (const word of words) {
      if (
        word.length > 3 &&
        word[0] === word[0].toUpperCase() &&
        !word.includes('.') &&
        !word.includes(',') &&
        !['The', 'This', 'That', 'Material', 'Analysis'].includes(word)
      ) {
        materialName = word;
        break;
      }
    }
  }
  
  return {
    identifiedMaterial: {
      name: materialName,
      type: materialType,
      description,
      properties: {
        tensileStrength: "Analysis in progress",
        compressiveStrength: "Analysis in progress",
        elasticModulus: "Analysis in progress",
        density: "Analysis in progress",
        thermalConductivity: "Analysis in progress",
        corrosionResistance: "Analysis in progress",
        formability: "Analysis in progress",
        cost: "Analysis in progress",
        biodegradability: "Analysis in progress"
      }
    },
    sustainableAlternatives: [
      {
        name: "Biodegradable Alternative",
        type: "Sustainable Material",
        description: "Consider using biodegradable or recyclable materials for better environmental impact.",
        properties: {
          tensileStrength: "Varies by material",
          compressiveStrength: "Varies by material",
          elasticModulus: "Varies by material",
          density: "Varies by material",
          thermalConductivity: "Varies by material",
          corrosionResistance: "Varies by material",
          formability: "Varies by material",
          cost: "Varies by material",
          biodegradability: "80-100%"
        },
        sustainabilityBenefits: [
          "Reduced environmental impact",
          "Better end-of-life options",
          "Renewable resource usage"
        ]
      }
    ],
    analysisNotes: text
  };
};

const ImageDetectionScreen = ({ navigation }) => {
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

  const analyzeImage = async (_imageUri, base64Image) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const systemPrompt = `You are an expert materials scientist and sustainability consultant. Your task is to analyze images of materials and provide detailed information about their properties and suggest sustainable alternatives.

CRITICAL: You must respond with ONLY valid JSON. Do not include any explanatory text, markdown formatting, or text before or after the JSON. Your entire response must be a single valid JSON object.

Respond with this exact JSON structure:
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

Focus on identifying common materials like plastics, metals, composites, textiles, and suggest biodegradable, recyclable, or renewable alternatives when possible.

REMEMBER: Respond with ONLY the JSON object. No additional text, explanations, or formatting.`;

      const userPrompt = `Please analyze this image and identify the material(s) visible. Provide detailed information about the material properties and suggest sustainable alternatives.`;

      const response = await generateOpenAIImageAnalysis(
        userPrompt,
        systemPrompt,
        base64Image
      );

      // Parse JSON
      try {
        let jsonString = response.trim();
        if (jsonString.startsWith('```json')) {
          jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (jsonString.startsWith('```')) {
          jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const jsonStart = jsonString.indexOf('{');
        const jsonEnd = jsonString.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          jsonString = jsonString.substring(jsonStart, jsonEnd);
        }
        const parsed = JSON.parse(jsonString);
        setAnalysisResult(parsed);
      } catch {
        const extractedInfo = extractMaterialInfoFromText(response);
        setAnalysisResult(extractedInfo);
      }
    } catch (error) {
      if (error.message.includes('API key') || error.message.includes('not configured')) {
        Alert.alert(
          'API Key Required', 
          'OpenAI API key is not configured. Using mock analysis for demonstration.',
          [{ text: 'OK' }]
        );
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
          analysisNotes: "This is a mock analysis for demonstration purposes. To get real AI analysis, please configure a valid OpenAI API key."
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Results</Text>

        {/* Identified Material */}
        <View style={styles.materialCard}>
          <Text style={styles.materialName}>{analysisResult.identifiedMaterial.name}</Text>
          <Text style={styles.materialType}>{analysisResult.identifiedMaterial.type}</Text>
          <Text style={styles.materialDescription}>{analysisResult.identifiedMaterial.description}</Text>
        </View>

        {/* Sustainable Alternatives */}
        {analysisResult.sustainableAlternatives && analysisResult.sustainableAlternatives.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Sustainable Alternatives</Text>
            {analysisResult.sustainableAlternatives.map((alt, index) => (
              <View key={index} style={styles.alternativeCard}>
                <Text style={styles.alternativeName}>{alt.name}</Text>
                <Text style={styles.alternativeType}>{alt.type}</Text>
                <Text style={styles.alternativeDescription}>{alt.description}</Text>

                {alt.sustainabilityBenefits && (
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsTitle}>Sustainability Benefits:</Text>
                    {alt.sustainabilityBenefits.map((b, i) => (
                      <Text key={i} style={styles.benefitItem}>• {b}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Analysis Notes */}
        {analysisResult.analysisNotes && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Additional Insights</Text>
            <Text style={styles.notesText}>{analysisResult.analysisNotes}</Text>
          </View>
        )}

        <TouchableOpacity onPress={resetAnalysis} style={[styles.button, styles.secondaryButton, { marginTop: 16 }]}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
          <Text style={styles.secondaryButtonText}>New Analysis</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {renderCamera()}

      {/* App Bar (matches Profile screen) */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Material Detection</Text>
        <Text style={styles.appBarSubtitle}>Identify materials and discover sustainable alternatives</Text>
        <View style={{ position: 'absolute', right: 16, top: 56 }}>
          <ProfileButton onPress={() => navigation.navigate('Profile')} userData={null} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Capture / Gallery card */}
        <View style={styles.section}>
          {capturedImage ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: capturedImage.uri }} style={styles.capturedImage} />
              {isAnalyzing && (
                <View style={styles.analyzingOverlay}>
                  <ActivityIndicator size="large" color={Colors.primary} />
                  <Text style={styles.analyzingText}>Analyzing material...</Text>
                </View>
              )}
              <View style={{ height: 8 }} />
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setCapturedImage(null)}
                disabled={isAnalyzing}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.primary} />
                <Text style={styles.secondaryButtonText}>Remove Image</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, styles.actionHalf]}
                onPress={() => setShowCamera(true)}
              >
                <Ionicons name="camera" size={22} color={Colors.secondary} />
                <Text style={styles.primaryButtonText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.darkButton, styles.actionHalf]}
                onPress={pickImageFromGallery}
              >
                <Ionicons name="images" size={22} color="white" />
                <Text style={styles.darkButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Analysis results (cards) */}
        {renderAnalysisResult()}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Layout matches Profile screen
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
    paddingRight: 56, // keeps text clear of ProfileButton
  },
  content: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 100,
  },

  // Card / section style (same as Profile)
  section: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 20,
  },

  // Buttons (aligned with Profile tone)
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionHalf: { flex: 1 },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.secondary,
    marginLeft: 8,
  },
  darkButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  darkButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 8,
  },

  // Camera overlay
  cameraContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
  },
  camera: { flex: 1 },
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
  cameraControls: { alignItems: 'center', paddingBottom: 30 },
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

  // Image preview
  imageContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  capturedImage: {
    width: screenWidth - 48,
    height: 280,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: { color: 'white', fontSize: 16, marginTop: 10 },

  // Result cards (match card aesthetic)
  materialCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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

  alternativeCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  alternativeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  alternativeType: { fontSize: 14, color: Colors.primary, marginBottom: 8 },
  alternativeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
    lineHeight: 20,
  },
  benefitsContainer: { marginTop: 6 },
  benefitsTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  benefitItem: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4, lineHeight: 18 },

  notesText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
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
});

export default ImageDetectionScreen;
