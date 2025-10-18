import React, { useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { Colors } from '../constants/colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Molecular3DViewer = ({ smiles, structureType, molecularNotes }) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isMaximized, setIsMaximized] = useState(false);

  // Generate dynamic legend based on SMILES code
  const generateAtomLegend = (smiles) => {
    if (!smiles) return [];
    
    const atoms = new Set();
    const smilesUpper = smiles.toUpperCase();
    
    // Parse SMILES to find atoms
    // Common elements in SMILES notation with standard chemistry colors
    const elementPatterns = [
      { symbol: 'C', name: 'Carbon', color: '#909090' }, // Grey
      { symbol: 'O', name: 'Oxygen', color: '#FF0000' }, // Red
      { symbol: 'N', name: 'Nitrogen', color: '#3050F8' }, // Blue
      { symbol: 'P', name: 'Phosphorus', color: '#FF8000' }, // Orange
      { symbol: 'S', name: 'Sulfur', color: '#FFFF30' }, // Yellow
      { symbol: 'H', name: 'Hydrogen', color: '#FFFFFF' }, // White
      { symbol: 'F', name: 'Fluorine', color: '#90E050' }, // Light Green
      { symbol: 'Cl', name: 'Chlorine', color: '#1FF01F' }, // Green
      { symbol: 'Br', name: 'Bromine', color: '#A62929' }, // Dark Red
      { symbol: 'I', name: 'Iodine', color: '#940094' }, // Dark Purple
      { symbol: 'Si', name: 'Silicon', color: '#F0C8A0' }, // Tan
      { symbol: 'Mg', name: 'Magnesium', color: '#8AFF00' }, // Bright Green
      { symbol: 'Ca', name: 'Calcium', color: '#3DFF00' }, // Green
      { symbol: 'Na', name: 'Sodium', color: '#AB5CF2' }, // Purple
      { symbol: 'K', name: 'Potassium', color: '#8F40D4' }, // Purple
      { symbol: 'Fe', name: 'Iron', color: '#E06633' }, // Orange
      { symbol: 'Cu', name: 'Copper', color: '#C88033' }, // Copper
      { symbol: 'Zn', name: 'Zinc', color: '#7D80B0' }, // Grey-Blue
      { symbol: 'Al', name: 'Aluminum', color: '#BFA6A6' }, // Grey
      { symbol: 'Ti', name: 'Titanium', color: '#BFC2C7' } // Grey
    ];
    
    // Parse SMILES more accurately - handle brackets and complex notation
    const parseSmiles = (smiles) => {
      let i = 0;
      while (i < smiles.length) {
        let found = false;
        
        // Check for two-letter elements first (like Cl, Br, Mg, Ca, etc.)
        if (i + 1 < smiles.length) {
          const twoLetter = smiles.substring(i, i + 2);
          const twoLetterElement = elementPatterns.find(el => el.symbol === twoLetter);
          if (twoLetterElement) {
            atoms.add(twoLetterElement);
            i += 2;
            found = true;
          }
        }
        
        // If no two-letter element found, check for single-letter elements
        if (!found) {
          const char = smiles[i];
          const singleLetterElement = elementPatterns.find(el => el.symbol === char);
          if (singleLetterElement) {
            atoms.add(singleLetterElement);
          }
          i++;
        }
      }
    };
    
    // Clean SMILES string and parse
    const cleanSmiles = smilesUpper
      .replace(/\[.*?\]/g, '') // Remove brackets and their contents for now
      .replace(/[0-9]/g, '') // Remove numbers
      .replace(/[()=]/g, '') // Remove bonds and parentheses
      .replace(/[#\\\/]/g, ''); // Remove other bond symbols
    
    parseSmiles(cleanSmiles);
    
    // Also parse bracketed elements (like [Na+], [Cl-], etc.)
    const bracketedElements = smilesUpper.match(/\[([A-Z][a-z]?)\]/g);
    if (bracketedElements) {
      bracketedElements.forEach(bracketed => {
        const elementSymbol = bracketed.replace(/[\[\]]/g, '');
        const element = elementPatterns.find(el => el.symbol === elementSymbol);
        if (element) {
          atoms.add(element);
        }
      });
    }
    
    // Add hydrogen if we have organic elements (C, N, O, P, S, etc.)
    // This is a heuristic - most organic molecules have hydrogens
    const organicElements = ['C', 'N', 'O', 'P', 'S'];
    const hasOrganicElements = Array.from(atoms).some(atom => organicElements.includes(atom.symbol));
    
    if (hasOrganicElements) {
      const hydrogen = elementPatterns.find(el => el.symbol === 'H');
      if (hydrogen) {
        atoms.add(hydrogen);
      }
    }
    
    return Array.from(atoms).sort((a, b) => a.name.localeCompare(b.name));
  };

  const html = useMemo(() => {
    const safeSmiles = (smiles || '').trim();

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
        <title>Molecular Viewer</title>
        <style>
          html, body { 
            margin: 0; 
            height: 100%; 
            background: #0A0A0A; 
            overflow: hidden;
            touch-action: manipulation;
            -webkit-overflow-scrolling: touch;
          }
          #viewer { 
            width: 100vw; 
            height: 100vh; 
            touch-action: manipulation;
            -webkit-transform: translateZ(0);
            transform: translateZ(0);
          }
          .overlay {
            position: absolute; left: 10px; top: 10px; z-index: 5;
            background: rgba(26,26,26,0.9); color: #fff; padding: 10px; border-radius: 8px;
            font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size: 12px; max-width: 75vw;
            pointer-events: none;
          }
          .bottom {
            position: absolute; left: 10px; right: 10px; bottom: 10px; z-index: 5;
            background: rgba(26,26,26,0.9); color: #fff; padding: 8px; border-radius: 8px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
            font-size: 11px; word-break: break-word; text-align: center;
            pointer-events: none;
          }
          .debug {
            position: absolute; right: 10px; top: 10px; z-index: 5;
            background: rgba(0,255,0,0.1); color: #0f0; padding: 6px 8px; border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 10px;
            pointer-events: none;
          }
          .center {
            position: absolute; inset: 0; display: grid; place-items: center; z-index: 4;
            color: #9aa0a6; font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size: 14px;
            text-align: center; padding: 0 16px;
            pointer-events: none;
          }
          .error { color: #ff6b6b; }
        </style>
      </head>
      <body>
        <div class="overlay">
          <div><strong>Structure:</strong> ${structureType || 'N/A'}</div>
          <div><strong>Source:</strong> PubChem SDF (3D → 2D fallback)</div>
        </div>
        <div id="debug" class="debug">Initializing…</div>
        <div id="viewer"></div>
        <div id="center" class="center">Loading…</div>
        <div class="bottom">SMILES: ${safeSmiles || '(empty)'}</div>

        <script>
          (function () {
            const RN = (typeof window !== 'undefined' && window.ReactNativeWebView) ? window.ReactNativeWebView : null;
            const send = (type, payload) => { try { RN && RN.postMessage(JSON.stringify({ type, ...payload })); } catch(_){} };
            const setDebug = (msg) => { const el = document.getElementById('debug'); if (el) el.textContent = msg; console.log('[3D DEBUG]', msg); };

            const SMILES = ${JSON.stringify(safeSmiles)};
            const SMILES_ENC = encodeURIComponent(SMILES || '');
            const PUBCHEM_3D = SMILES ? \`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/\${SMILES_ENC}/SDF?record_type=3d\` : null;
            const PUBCHEM_2D = SMILES ? \`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/\${SMILES_ENC}/SDF?record_type=2d\` : null;

            // Robust multi-CDN loader for 3Dmol
            const CDN_LIST = [
              'https://3dmol.org/build/3Dmol-min.js',
              'https://cdn.jsdelivr.net/npm/3dmol/build/3Dmol-min.js',
              'https://unpkg.com/3dmol/build/3Dmol-min.js'
            ];

            function loadScript(url) {
              return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = url;
                s.async = true;
                s.onload = () => resolve(url);
                s.onerror = () => reject(new Error('Failed to load ' + url));
                document.head.appendChild(s);
              });
            }

            async function ensure3Dmol() {
              for (let i = 0; i < CDN_LIST.length; i++) {
                const url = CDN_LIST[i];
                try {
                  setDebug('Loading 3Dmol: ' + url);
                  await loadScript(url);
                  // wait until $3Dmol appears
                  const ok = await new Promise((resolve) => {
                    let tries = 0;
                    const max = 120; // 12s
                    const tick = () => {
                      if (typeof window.$3Dmol !== 'undefined' && window.$3Dmol.createViewer) return resolve(true);
                      if (tries++ > max) return resolve(false);
                      setTimeout(tick, 100);
                    };
                    tick();
                  });
                  if (ok) {
                    setDebug('3Dmol ready ✓');
                    return true;
                  }
                  setDebug('3Dmol not ready after load, trying next CDN…');
                } catch (e) {
                  setDebug('CDN failed: ' + e.message);
                }
              }
              return false;
            }

            async function fetchSDF(url) {
              setDebug('Fetching SDF…');
              const res = await fetch(url, { method: 'GET' });
              if (!res.ok) throw new Error('HTTP ' + res.status);
              const text = await res.text();
              if (!text || !text.trim()) throw new Error('Empty SDF');
              return text;
            }

            function renderSDF(sdfText, is3D) {
              const container = document.getElementById('viewer');
              const viewer = $3Dmol.createViewer(container, { backgroundColor: '#0A0A0A' });
              viewer.addModel(sdfText, 'sdf');
              viewer.setStyle({}, { stick: { radius: 0.16 }, sphere: { scale: 0.25 } });
              viewer.zoomTo();
              viewer.render();
              const center = document.getElementById('center');
              if (center) center.style.display = 'none';
              setDebug(is3D ? 'Rendered 3D ✓' : 'Rendered 2D coords ✓');
              send('loaded', { is3D: !!is3D });
            }

            async function run() {
              const center = document.getElementById('center');
              if (!SMILES) {
                const msg = 'No SMILES provided';
                setDebug(msg);
                if (center) center.innerHTML = '<div class="error">' + msg + '</div>';
                send('error', { message: msg });
                return;
              }

              try {
                const ok = await ensure3Dmol();
                if (!ok) throw new Error('Could not load 3Dmol from any CDN');

                // Try PubChem 3D first
                try {
                  setDebug('Trying PubChem 3D…');
                  const sdf3d = await fetchSDF(PUBCHEM_3D);
                  renderSDF(sdf3d, true);
                  return;
                } catch (e3d) {
                  console.warn('3D fetch failed:', e3d);
                }

                // Then fallback to 2D
                setDebug('Falling back to 2D…');
                const sdf2d = await fetchSDF(PUBCHEM_2D);
                renderSDF(sdf2d, false);
              } catch (err) {
                console.error(err);
                setDebug('Failed ✗ ' + err.message);
                if (center) {
                  center.innerHTML = '<div class="error">Unable to load structure.<br/>' + (err && err.message ? err.message : '') + '</div>';
                }
                send('error', { message: String(err && err.message || err) });
              }
            }

            // Start
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', run);
            } else {
              run();
            }

            // Resize handling
            window.addEventListener('resize', function () {
              try { 
                const c = document.getElementById('viewer');
                if (c && c.viewer) { c.viewer.resize(); c.viewer.render(); }
              } catch(_) {}
            });
          })();
        </script>
      </body>
      </html>
    `;
  }, [smiles, structureType]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading molecular structure...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webView}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.log('WebView error:', e.nativeEvent);
          setLoading(false);
        }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        allowFileAccess
        // Performance optimizations
        androidHardwareAccelerationDisabled={false}
        androidLayerType="hardware"
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        bounces={false}
        bouncesZoom={false}
        decelerationRate="fast"
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'error') {
              console.log('Viewer error:', msg.message);
            } else if (msg.type === 'loaded') {
              console.log('Viewer loaded. is3D:', msg.is3D);
            }
          } catch { /* ignore */ }
        }}
      />

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.maximizeButton} 
          onPress={() => setIsMaximized(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="expand" size={20} color={Colors.primary} />
          <Text style={styles.maximizeText}>Maximize</Text>
        </TouchableOpacity>
      </View>

      {molecularNotes ? (
        <View style={styles.notesContainer}>
          <Text style={styles.notesTitle}>Molecular Notes</Text>
          <Text style={styles.notesText}>{molecularNotes}</Text>
        </View>
      ) : null}

      {(() => {
        const atomsInMolecule = generateAtomLegend(smiles);
        return atomsInMolecule.length > 0 ? (
          <View style={styles.legendContainer}>
            <Text style={styles.legendTitle}>Atoms in this molecule</Text>
            <View style={styles.legendGrid}>
              {atomsInMolecule.map((atom, index) => (
                <View key={index} style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: atom.color }]} />
                  <Text style={styles.legendText}>{atom.name} ({atom.symbol})</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null;
      })()}

      {/* Maximize Modal */}
      <Modal
        visible={isMaximized}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setIsMaximized(false)}
      >
        <View style={styles.maximizedContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsMaximized(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
          
          <WebView
            source={{ html }}
            style={styles.maximizedWebView}
            originWhitelist={['*']}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowFileAccess
            androidHardwareAccelerationDisabled={false}
            androidLayerType="hardware"
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            bouncesZoom={false}
            decelerationRate="fast"
            onMessage={(event) => {
              try {
                const msg = JSON.parse(event.nativeEvent.data);
                if (msg.type === 'error') {
                  console.log('Maximized viewer error:', msg.message);
                } else if (msg.type === 'loaded') {
                  console.log('Maximized viewer loaded. is3D:', msg.is3D);
                }
              } catch { /* ignore */ }
            }}
          />
        </View>
      </Modal>
    </View>
  );
};

Molecular3DViewer.propTypes = {
  smiles: PropTypes.string,
  structureType: PropTypes.string,
  molecularNotes: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    height: 500,
    width: '100%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  webView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.9)', justifyContent: 'center', alignItems: 'center', zIndex: 10,
  },
  loadingText: {
    marginTop: 10, color: Colors.textSecondary, fontSize: 14,
  },
  notesContainer: {
    padding: 12, backgroundColor: Colors.surface, borderTopWidth: 1, borderColor: Colors.border,
  },
  notesTitle: {
    fontSize: 14, fontWeight: 'bold', color: Colors.primary, marginBottom: 4,
  },
  notesText: {
    fontSize: 12, color: Colors.textSecondary,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  maximizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  maximizeText: {
    marginLeft: 6,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  legendContainer: {
    padding: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  maximizedContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: 110,
    paddingBottom: 35  },
  closeButton: {
    position: 'absolute',
    top: 62.5,
    right: 20,
    zIndex: 1000,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  maximizedWebView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default Molecular3DViewer;
