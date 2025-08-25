import { Button, StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../../FirebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from '@firebase/firestore';
import { FlatList } from 'react-native';

interface Todo {
  id: string;
  task: string;
  completed: boolean;
  userId: string;
}

export default function TabTwoScreen() {
  const [task, setTask] = useState('');        //Singale todo
  const [todos, setTodos] = useState<Todo[]>([]); // All array of single todo's
  const auth = getAuth();        //get only this user's todos
  const user = auth.currentUser;
  const todosCollection = collection(db, 'todos');       //collection ref

  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  const fetchTodos = async () => {
    try {
      if (user) {
        const q = query(todosCollection, where('userId', '==', user.uid));   // find the current user
        const data = await getDocs(q);  // Get the todos
        setTodos(data.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Todo))); // Set the todos
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error fetching todos:', error);
    }
  };

  const addTodo = async () => {
    try {
      if (user && task.trim()) {
        await addDoc(todosCollection, { task: task.trim(), completed: false, userId: user.uid }); // Add a new todo
        setTask('');
        fetchTodos();
      } else {
        console.log('No user logged in or task is empty');
      }
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const updateTodo = async (id: string, completed: boolean) => {
    try {
      if (user) {
        const todoDoc = doc(db, 'todos', id);
        await updateDoc(todoDoc, { completed: !completed });
        fetchTodos();
      }
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      if (user) {
        const todoDoc = doc(db, 'todos', id);
        await deleteDoc(todoDoc);
        fetchTodos();
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Todo List</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter task"
          value={task}
          onChangeText={setTask}
        />
        <Button title="Add" onPress={addTodo} />
      </View>

      <FlatList
        data={todos}
        renderItem={({ item }) => (
          <View style={styles.todoItem}>
            <Text style={{ textDecorationLine: item.completed ? 'line-through' : 'none', flex: 1 }}>
              {item.task}
            </Text>
            <TouchableOpacity
              style={styles.todoButton}
              onPress={() => updateTodo(item.id, item.completed)}
            >
              <Text>{item.completed ? 'Undo' : 'Complete'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todoButton}
              onPress={() => deleteTodo(item.id)}
            >
              <Text>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No todos yet!</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    flex: 1,
    marginRight: 10,
    padding: 10,
    borderRadius: 5,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  todoButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginRight: 10,
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
});