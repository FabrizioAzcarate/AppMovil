import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { createUser, deleteUser, getAllUsers, updateUser } from '../database/db';

export default function AdminScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadCurrentUser();
    loadUsers();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        setCurrentUser(JSON.parse(userJson));
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const usersList = await getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios.');
    }
  };

  const handleCreate = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Por favor complete todos los campos.');
      return;
    }

    try {
      await createUser(username, password, role);
      setModalVisible(false);
      clearForm();
      loadUsers();
      Alert.alert('Éxito', 'Usuario creado correctamente.');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'No se pudo crear el usuario.');
    }
  };

  const handleUpdate = async () => {
    if (!username) {
      Alert.alert('Error', 'Necesita ingresar un nombre de usuario.');
      return;
    }

    try {
      let finalRole = role;
      if (
        editingUser &&
        currentUser &&
        editingUser.id === currentUser.id &&
        currentUser.role === 'admin' &&
        role !== 'admin'
      ) {
        finalRole = 'admin';
        Alert.alert(
          'Atención',
          'No puedes quitarte el rol de admin. El rol se mantendrá como admin.'
        );
      }

      const updates = {
        username,
        role: finalRole,
        ...(password ? { password } : {}),
      };

      await updateUser(editingUser.id, updates);
      setModalVisible(false);
      clearForm();
      loadUsers();
      Alert.alert('Éxito', 'Usuario actualizado correctamente.');
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario.');
    }
  };

  const handleDelete = async (userId) => {
    try {
      if (userId === 1) {
        Alert.alert('Error', 'No se puede eliminar al usuario administrador.');
        return;
      }
      
      if (userId === currentUser?.id) {
        Alert.alert('Error', 'No podes eliminarte a ti mismo.');
        return;
      }

      Alert.alert(
        'Confirmar',
        '¿Está seguro de que desea eliminar a este usuario?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await deleteUser(userId);
              loadUsers();
              Alert.alert('Éxito', 'Usuario eliminado correctamente.');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'No se pudo eliminar el usuario.');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  const clearForm = () => {
    setUsername('');
    setPassword('');
    setRole('user');
    setEditingUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setUsername(user.username);
    setRole(user.role);
    setPassword('');
    setModalVisible(true);
  };

  const isEditingSelfAdmin = !!(
    editingUser &&
    currentUser &&
    editingUser.id === currentUser.id &&
    currentUser.role === 'admin'
  );

  const renderItem = ({ item }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfoRow}>
        <Text style={styles.username}>{item.username}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>{item.role}</Text>
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => openEditModal(item)}
        >
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
        {item.id !== 1 && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Panel de Administración</Text>
      </View>

      <View style={styles.logoutButtonContainer}>
        <Button title="Cerrar Sesión" onPress={handleLogout} color="#E50914" />
      </View>

      <View style={styles.createButtonContainer}>
        <Button
          title="Crear Nuevo Usuario"
          onPress={() => {
            clearForm();
            setModalVisible(true);
          }}
        />
      </View>

      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          clearForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingUser ? 'Editar Usuario' : 'Crear Usuario'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={editingUser ? "Ingese su nombre de usuario" : "Nombre de usuario"}
              placeholderTextColor="#fff"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder={editingUser ? "Ingese su nueva contraseña (opcional)" : "Contraseña"}
              placeholderTextColor="#fff"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={styles.roleSelector}>
              <Text style={styles.roleSelectorLabel}>Rol:</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'user' ? styles.roleOptionSelected : null,
                    isEditingSelfAdmin ? styles.roleOptionDisabled : null,
                  ]}
                  onPress={() => !isEditingSelfAdmin && setRole('user')}
                  disabled={isEditingSelfAdmin}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === 'user' ? styles.roleOptionTextSelected : null,
                    ]}
                  >
                    Usuario
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleOption,
                    role === 'admin' ? styles.roleOptionSelected : null,
                    isEditingSelfAdmin ? styles.roleOptionDisabled : null,
                  ]}
                  onPress={() => !isEditingSelfAdmin && setRole('admin')}
                  disabled={isEditingSelfAdmin}
                >
                  <Text
                    style={[
                      styles.roleOptionText,
                      role === 'admin' ? styles.roleOptionTextSelected : null,
                    ]}
                  >
                    Admin
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                onPress={() => {
                  setModalVisible(false);
                  clearForm();
                }}
                color="#2e353c"
              />
              <Button
                title={editingUser ? "Actualizar" : "Crear"}
                onPress={editingUser ? handleUpdate : handleCreate}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000000',
  },
  headerTop: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButtonContainer: {
    marginBottom: 10,
  },
  createButtonContainer: {
    marginBottom: 15,
  },
  list: {
    flex: 1,
    marginVertical: 20,
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userInfoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  role: {
    fontSize: 14,
    color: '#fff',
  },

  roleBadge: {
    backgroundColor: '#2e353c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 5,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0d1117',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    height: 40,
    borderColor: 'white',
    color: '#fff',
    backgroundColor: '#000000',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  roleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  roleSelectorLabel: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  roleOptions: {
    flexDirection: 'row',
    marginLeft: 10,
  },
  roleOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#2e353c',
    marginRight: 8,
  },
  roleOptionSelected: {
    backgroundColor: '#007AFF',
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  roleOptionText: {
    color: '#fff',
    fontWeight: '600',
  },
  roleOptionTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
});