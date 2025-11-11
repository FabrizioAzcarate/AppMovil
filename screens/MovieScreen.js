import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getPopularMovies, IMAGE_URL, searchMovies } from '../services/MovieService';

export default function MovieScreen({ navigation }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const loadPopularMovies = async () => {
    try {
      setLoading(true);
      const data = await getPopularMovies();
      setMovies(data);
    } catch (error) {
      console.error('Error al obtener películas populares:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularMovies();
      return;
    }

    try {
      setSearching(true);
      const results = await searchMovies(searchQuery);
      setMovies(results);
    } catch (error) {
      console.error('Error al buscar películas:', error);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    loadPopularMovies();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando películas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar películas..."
            placeholderTextColor="#fff"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
            disabled={searching}
          >
            <Text style={styles.searchButtonText}>
              {searching ? 'Buscando...' : 'Buscar'}
            </Text>
          </TouchableOpacity>
        </View>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#E50914" />
      </View>

      {searching ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text>Buscando películas...</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.movieCard}>
              {item.poster_path ? (
                <Image
                  source={{ uri: `${IMAGE_URL}${item.poster_path}` }}
                  style={styles.poster}
                />
              ) : (
                <View style={[styles.poster, styles.noPoster]}>
                  <Text>Sin póster</Text>
                </View>
              )}
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.overview} numberOfLines={2}>
                {item.overview || 'Sin descripción disponible'}
              </Text>
              <Text style={styles.releaseDate}>
                Fecha: {item.release_date || 'No disponible'}
              </Text>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    Color: '#fff',
  },
  header: {
    padding: 10,
    backgroundColor: '#2e353c',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#000000',
    color: '#fff',
  },
  searchButton: {
    backgroundColor: '#0070f3',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 10,
  },
  movieCard: {
    backgroundColor: '#0d1117',
    borderRadius: 10,
    marginBottom: 15,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  poster: {
    width: 200,
    height: 300,
    borderRadius: 10,
  },
  noPoster: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginTop: 10,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  overview: {
    marginTop: 5,
    textAlign: 'center',
    color: '#fff',
    paddingHorizontal: 10,
  },
  releaseDate: {
    marginTop: 5,
    color: '#fff',
    fontSize: 12,
  },
});
