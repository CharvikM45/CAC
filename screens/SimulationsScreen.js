import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { parseCSVData } from '../utils/dataService';
import MaterialPickerModal from '../components/MaterialPickerModal';
import { WebView } from 'react-native-webview';

const CONDITION_OPTIONS = [
  { key: 'Increase_Temp', label: '↑ Temperature' },
  { key: 'Decrease_Temp', label: '↓ Temperature' },
  { key: 'Increase_Pressure', label: '↑ Pressure' },
  { key: 'Decrease_Pressure', label: '↓ Pressure' },
  { key: 'Increase_Humidity', label: '↑ Humidity' },
  { key: 'Decrease_Humidity', label: '↓ Humidity' },
  { key: 'Increase_UV', label: '↑ UV' },
  { key: 'Decrease_UV', label: '↓ UV' },
];

const DURATION_OPTIONS = [
  { key: '1d', label: '1 Day' },
  { key: '1w', label: '1 Week' },
  { key: '1m', label: '1 Month' },
  { key: '1y', label: '1 Year' },
  { key: '10y', label: '10 Years' },
];

const DURATION_TO_DAYS = {
  '0d': 0,
  '1d': 1,
  '1w': 7,
  '1m': 30,
  '1y': 365,
  '10y': 3650,
};

const ChartView = ({ labels, data, color = '#1A73E8' }) => {
  const html = useMemo(() => {
    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            html, body { margin: 0; padding: 0; background: ${Colors.background}; }
            #c { width: 100vw; height: 280px; }
          </style>
        </head>
        <body>
          <canvas id="c"></canvas>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2"></script>
          <script>
            (function(){
              const ctx = document.getElementById('c').getContext('2d');
              const labels = ${JSON.stringify(labels)};
              const data = ${JSON.stringify(data)};
              try {
                // Attempt to register zoom plugin if available
                if (window.Chart && (window['chartjs-plugin-zoom'] || window.ChartZoom || window.ChartZoomPlugin)) {
                  const plugin = window['chartjs-plugin-zoom'] || window.ChartZoom || window.ChartZoomPlugin;
                  if (plugin && typeof window.Chart.register === 'function') {
                    window.Chart.register(plugin);
                  }
                }
              } catch (e) { /* no-op */ }

              const chart = new Chart(ctx, {
                type: 'line',
                data: {
                  labels,
                  datasets: [{
                    label: '% Retention',
                    data,
                    fill: false,
                    borderColor: '${color}',
                    backgroundColor: '${color}',
                    tension: 0.25,
                    pointRadius: 3,
                  }]
                },
                options: {
                  animation: false,
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: { display: true, text: 'Retention (%)' }
                    },
                    x: {
                      title: { display: true, text: 'Time' }
                    }
                  },
                  plugins: {
                    legend: { display: false },
                    zoom: {
                      zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                      },
                      pan: {
                        enabled: true,
                        mode: 'xy'
                      },
                      limits: {
                        y: { min: 0, max: 100 }
                      }
                    }
                  }
                }
              });

              // Double-tap or double-click to reset zoom
              const canvas = document.getElementById('c');
              let lastTap = 0;
              canvas.addEventListener('click', function(e) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                if (tapLength < 300 && tapLength > 0) {
                  if (chart && typeof chart.resetZoom === 'function') chart.resetZoom();
                }
                lastTap = currentTime;
              });
            })();
          </script>
        </body>
      </html>
    `;
  }, [labels, data, color]);

  return (
    <View style={{ height: 280, backgroundColor: Colors.card, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border }}>
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        style={{ flex: 1, backgroundColor: Colors.card }}
      />
    </View>
  );
};

const SimulationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [csvRows, setCsvRows] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0].key);
  const [duration, setDuration] = useState('10y');

  useEffect(() => {
    loadCsv();
  }, []);

  const loadCsv = async () => {
    try {
      setLoading(true);
      const [asset] = await Asset.loadAsync([require('../assets/data/FullDatasheet.csv')]);
      const uri = asset.localUri || asset.uri;
      const text = uri && uri.startsWith('http')
        ? await (await fetch(uri)).text()
        : await FileSystem.readAsStringAsync(uri, { encoding: 'utf8' });
      const rows = parseCSVData(text);
      setCsvRows(rows);
    } catch (e) {
      console.error('Failed to load CSV:', e);
      setCsvRows([]);
    } finally {
      setLoading(false);
    }
  };

  const retentionColumnsFor = (condKey) => ({
    '1w': `${condKey}_1w_%Retention`,
    '1m': `${condKey}_1m_%Retention`,
    '1y': `${condKey}_1y_%Retention`,
    '10y': `${condKey}_10y_%Retention`,
  });

  const getRowForMaterial = (name) => csvRows.find(r => (r['Material Name'] || '').toLowerCase() === (name || '').toLowerCase());

  const computeSeries = useMemo(() => {
    if (!selectedMaterial || !csvRows.length) return { labels: [], data: [] };
    const row = getRowForMaterial(selectedMaterial['Material Name']);
    if (!row) return { labels: [], data: [] };

    const cols = retentionColumnsFor(condition);
    const points = [
      { t: '0d', days: 0, value: 100 },
      { t: '1w', days: DURATION_TO_DAYS['1w'], value: parseFloat(row[cols['1w']] || '100') },
      { t: '1m', days: DURATION_TO_DAYS['1m'], value: parseFloat(row[cols['1m']] || row[cols['1w']] || '100') },
      { t: '1y', days: DURATION_TO_DAYS['1y'], value: parseFloat(row[cols['1y']] || row[cols['1m']] || '100') },
      { t: '10y', days: DURATION_TO_DAYS['10y'], value: parseFloat(row[cols['10y']] || row[cols['1y']] || '100') },
    ];

    // Interpolate 1d between 0d (100) and 1w
    const v0 = 100;
    const v1w = points[1].value;
    const v1d = v0 + (v1w - v0) * (DURATION_TO_DAYS['1d'] / DURATION_TO_DAYS['1w']);
    const with1d = [
      { t: '0d', days: 0, value: v0 },
      { t: '1d', days: 1, value: Number.isFinite(v1d) ? v1d : v0 },
      ...points.slice(1),
    ];

    const cutoffDays = DURATION_TO_DAYS[duration] ?? DURATION_TO_DAYS['10y'];
    const filtered = with1d.filter(p => p.days <= cutoffDays);
    const labels = filtered.map(p => p.t);
    const data = filtered.map(p => Number.isFinite(p.value) ? Math.max(0, Math.min(100, Number(p.value))) : 100);
    return { labels, data };
  }, [selectedMaterial, csvRows, condition, duration]);

  const selectedCondLabel = CONDITION_OPTIONS.find(c => c.key === condition)?.label || '';

  return (
    <View style={styles.container}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Simulations</Text>
        <Text style={styles.appBarSubtitle}>Visualize material retention under conditions</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Material Selector */}
          <View style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>Material</Text>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {selectedMaterial ? selectedMaterial['Material Name'] : 'Select a material'}
                </Text>
              </View>
              <TouchableOpacity style={styles.selectBtn} onPress={() => setPickerVisible(true)}>
                <Ionicons name="list" size={18} color={Colors.primary} />
                <Text style={styles.selectBtnText}>Choose</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditions */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Condition</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {CONDITION_OPTIONS.map((opt) => {
                const active = condition === opt.key;
                return (
                  <TouchableOpacity key={opt.key} onPress={() => setCondition(opt.key)} style={[styles.pill, active && styles.pillActive]}>
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Duration */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Duration</Text>
            <View style={styles.segmentRow}>
              {DURATION_OPTIONS.map((opt) => {
                const active = duration === opt.key;
                return (
                  <TouchableOpacity key={opt.key} onPress={() => setDuration(opt.key)} style={[styles.segment, active && styles.segmentActive]}>
                    <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Chart */}
          <View style={styles.card}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.cardTitle}>% Retention Over Time</Text>
              <Text style={styles.infoText}>{selectedCondLabel}</Text>
            </View>
            {!selectedMaterial ? (
              <View style={styles.placeholderBox}>
                <Ionicons name="analytics-outline" size={32} color={Colors.textSecondary} />
                <Text style={styles.placeholderText}>Select a material to simulate</Text>
              </View>
            ) : computeSeries.labels.length === 0 ? (
              <View style={styles.placeholderBox}>
                <Ionicons name="warning-outline" size={32} color={Colors.textSecondary} />
                <Text style={styles.placeholderText}>No data available for this condition</Text>
              </View>
            ) : (
              <ChartView labels={computeSeries.labels} data={computeSeries.data} />
            )}
          </View>
        </ScrollView>
      )}

      {/* Material Picker */}
      <MaterialPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelectMaterial={setSelectedMaterial}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    maxWidth: 220,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectBtnText: {
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: 6,
  },
  pillsRow: {
    paddingTop: 8,
    gap: 8,
  },
  pill: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.primary,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  segment: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 90,
  },
  segmentActive: {
    backgroundColor: Colors.primary + '22',
    borderColor: Colors.primary,
  },
  segmentText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: Colors.primary,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderBox: {
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  placeholderText: {
    color: Colors.textSecondary,
    marginTop: 8,
  },
});

export default SimulationsScreen;


