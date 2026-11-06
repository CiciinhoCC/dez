// screens/EditNoteScreen.js
import React, { useState, useLayoutEffect, useMemo } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Switch,
} from 'react-native';
import { API_URL } from '../constants';

export default function EditNoteScreen({ route, navigation }) {
  const { noteId, token, user, initial } = route.params || {};
  const isEditing = !!noteId;

  const [title, setTitle] = useState(initial?.title || '');
  const [subject, setSubject] = useState(initial?.subject || '');
  const [content, setContent] = useState(initial?.content || '');
  const [isPublic, setIsPublic] = useState(initial?.is_public || false);
  const [saving, setSaving] = useState(false);

  // Title the header based on mode
  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Note' : 'New Note',
    });
  }, [navigation, isEditing]);

  const isDirty = useMemo(() => {
    if (!isEditing) return title || subject || content;
    return (
      title !== (initial?.title || '') ||
      subject !== (initial?.subject || '') ||
      content !== (initial?.content || '') ||
      isPublic !== (initial?.is_public || false)
    );
  }, [title, subject, content, isPublic, initial, isEditing]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give your note a title.');
      return;
    }
    if (!content.trim()) {
      Alert.alert('Missing content', 'Write something before saving.');
      return;
    }

    setSaving(true);
    try {
      const body = {
        title: title.trim(),
        subject: subject.trim() || 'General',
        content,
        is_public: isPublic ? 1 : 0,
      };

      const url = isEditing
        ? `${API_URL}/api/notes/${noteId}`
        : `${API_URL}/api/notes`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Save failed', data.error || `Status ${res.status}`);
        return;
      }

      if (isEditing) {
        navigation.goBack();
      } else {
        // Replace so back doesn't return to the (already-saved) editor
        navigation.replace('NoteView', {
          noteId: data.id,
          token,
          user,
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Network error', 'Could not reach the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!isDirty) {
      navigation.goBack();
      return;
    }
    Alert.alert(
      'Discard changes?',
      'Your edits will be lost.',
      [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Note title"
          placeholderTextColor="#6c7086"
          value={title}
          onChangeText={setTitle}
          maxLength={150}
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Math, Physics, General"
          placeholderTextColor="#6c7086"
          value={subject}
          onChangeText={setSubject}
          maxLength={50}
        />

        <View style={styles.publicRow}>
          <Text style={styles.label}>Public</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#313244', true: '#89b4fa' }}
            thumbColor={isPublic ? '#cdd6f4' : '#6c7086'}
          />
        </View>

        <Text style={styles.label}>Markdown</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder={'# Heading\n\nWrite your note in markdown...'}
          placeholderTextColor="#6c7086"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoCapitalize="sentences"
        />
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#1e1e2e" />
          ) : (
            <Text style={styles.saveBtnText}>{isEditing ? 'Save' : 'Create'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#181825' },
  scroll: { padding: 16, paddingBottom: 100 },
  label: {
    color: '#a6adc8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1e1e2e',
    borderColor: '#313244',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#cdd6f4',
    fontSize: 15,
  },
  textarea: {
    minHeight: 280,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 14,
    lineHeight: 20,
  },
  publicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  actions: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#1e1e2e',
    borderTopWidth: 1,
    borderTopColor: '#313244',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#313244',
  },
  cancelBtnText: { color: '#a6adc8', fontSize: 15, fontWeight: '600' },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#a6e3a1',
  },
  saveBtnText: { color: '#1e1e2e', fontSize: 15, fontWeight: '700' },
});