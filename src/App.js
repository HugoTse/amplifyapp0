import logo from "./logo.svg";
import "@aws-amplify/ui-react/styles.css";

import React, { useState, useEffect } from 'react';
import './App.css';
import { API, Storage } from 'aws-amplify';
import { listNotes } from './graphql/queries';
import { createNote as createNoteMutation, deleteNote as deleteNoteMutation, updateNote as updateNoteMutation } from './graphql/mutations';

import {
  withAuthenticator,
  Button,
  Heading,
  Image,
  View,
  Card,
} from "@aws-amplify/ui-react";

const initialFormState = { name: '', description: '' }

function App({ signOut }) {

  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  // For editing the note
  // const[cname, setCname] = useState('');
  // const[cdesc, setCdesc] = useState('');
  // const[cid, setCid] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  // async function fetchNotes() {
  //   const apiData = await API.graphql({ query: listNotes });
  //   setNotes(apiData.data.listNotes.items);
  // }

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(notesFromAPI.map(async note => {
      if (note.image) {
        const image = await Storage.get(note.image);
        note.image = image;
      }
      return note;
    }))
    setNotes(apiData.data.listNotes.items);
  }

  // async function createNote() {
  //   if (!formData.name || !formData.description) return;
  //   await API.graphql({ query: createNoteMutation, variables: { input: formData } });
  //   setNotes([ ...notes, formData ]);
  //   setFormData(initialFormState);
  // }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({ query: createNoteMutation, variables: { input: formData } });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([ ...notes, formData ]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter(note => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({ query: deleteNoteMutation, variables: { input: { id } }});
  }

  // Adding the edit function
  async function editNote({ id }) {
    // const newNotesArray = notes.filter(note => note.id !== id);
    // setNotes(newNotesArray);
    // console.log(cid, cname, cdesc);
    if (!formData.name || !formData.description) return;
    console.log('hello');
    // const newNotesArray = notes.map((item) => {
    //   if(item.id ===id){
    //     console.log(item.id);
    //   }
    // })
    await API.graphql({ query: updateNoteMutation, variables: { input: { id: id, name: formData.name, description: formData.description } }});
    fetchNotes();
  }

  async function onChange(e) {
    if (!e.target.files[0]) return
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }


  return (
    <View className="App">

      <p>Testing changes</p>

      <div>
        <h1>Dashboard</h1>
        {/* For adding a note */}
        {/* Name input  */}
        <input
          onChange={e => setFormData({ ...formData, 'name': e.target.value})}
          placeholder="Note name"
          value={formData.name}
        />
        {/* Description input */}
        <input
          onChange={e => setFormData({ ...formData, 'description': e.target.value})}
          placeholder="Note description"
          value={formData.description}
        />
        <input
          type="file"
          onChange={onChange}
        />
        <button onClick={createNote}>Create Note</button>
        <div style={{marginBottom: 30}}>

        {
          notes.map(note => (
            <div key={note.id || note.name}>
              <h2>{note.name}</h2>
              <p>{note.description}</p>
              <button onClick={() => deleteNote(note)}>Delete note</button>
              <button onClick={() => editNote(note)}>Edit note</button>


              {
                note.image && <img src={note.image} style={{width: 400}} />
              }
            </div>
          ))
        }
        </div>
      </div>

      <Card>
        <Image src={logo} className="App-logo" alt="logo" />
        <Heading level={1}>We now have Auth!</Heading>
      </Card>
      <Button onClick={signOut}>Sign Out</Button>
    </View>
  );
}

export default withAuthenticator(App);