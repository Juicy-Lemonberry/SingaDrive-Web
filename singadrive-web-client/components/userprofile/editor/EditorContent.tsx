'use client'
import UAParser from 'ua-parser-js';
import config from '@/config';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import '@/styles/profile-editor/EditorContent.scss';
import { getSessionToken, removeSessionToken, setSessionToken } from '@/utils/accountSessionCookie';
import DatePicker from "react-datepicker";
import 'react-datepicker/dist/react-datepicker.css';

const DescriptionEditor = dynamic(() => import('@/components/userprofile/editor/DescriptionEditor'), {
  ssr: false
});

interface ExternalLink {
  title: string;
  url: string;
}

const ExternalLinksEditor = dynamic(() => import('@/components/userprofile/editor/ExternalLinksEditor'), {
  ssr: false
});

interface SessionToken {
  browserInfo: string;
  lastUsedDate: Date;
  firstLoginDate: Date;
}

const SessionTokenEditor = dynamic(() => import('@/components/userprofile/editor/SessionTokenEditor'), {
  ssr: false
});

const PasswordRequestor = dynamic(() => import('@/components/userprofile/editor/PasswordRequest'), {
  ssr: false
});

function isNullOrWhitespace(str: String) {
  return !str || !str.trim();
}

const ProfileEditor: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [displayName, setDisplayName] = useState('');
  const [birthday, setBirthday] = useState<Date | null>(null);
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [description, setNewDescription] = useState<string>('');
  const [sessionTokens, setSessionTokens] = useState<SessionToken[]>([]);
  const [currentPassword, setCurrentPassword] = useState<string | null>(null);

  // State to show/hide password request popup...
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  function handlePasswordSubmit(password: string): void {
    setCurrentPassword(currentPassword);
    setShowPasswordModal(false);
  }

  // To request, and set user data on page after content is first loaded.
  async function setUserData(token: string): Promise<void> {
    const parser = new UAParser();
    const browserName = parser.getBrowser().name;

    const jsonData = {
      "browser_info": browserName,
      "session_token": token
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    };
    
    const apiRoute = config.API_BASE_URL + '/api/users-edit/get-data';
    const response = await fetch(apiRoute, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('Failed to fetch user data: ', data);
      return;
    }
    
    switch (data.message) {
      case "INVALID":
        setUsername("Error loading data...");
        return;
      case "BROWSER":
        setUsername("Session token expired, login again!");
        removeSessionToken();
        return;
      case "EXPIRED":
        setUsername("Session token expired, login again!");
        removeSessionToken();
        return;
    }

    setUsername(data.username ?? 'N/A');
    setDisplayName(data.display_name ?? 'N/A');
    setBirthday(data.birthday ? new Date(data.birthday) : null);
    setExternalLinks(data.external_links ?? []);
    setEmail(data.email ?? 'N/A');
    setNewDescription(data.description ?? '');
    // Set session token if exists...
    if (data.session_tokens) {
      const transformedSessionTokens = data.session_tokens.map((token: any) => ({
        browserInfo: token.browser_info,
        lastUsedDate: new Date(token.last_used),
        firstLoginDate: new Date(token.created_at)
      }));
      setSessionTokens(transformedSessionTokens);
    }
  }

  const removeExistingSessionToken = (index: number) => {
    // Remove the session token at the given index
    const newSessionTokens = [...sessionTokens];
    newSessionTokens.splice(index, 1);
    setSessionTokens(newSessionTokens);
    // TODO: Request to backend remove token...
    window.location.reload();
  };


  useEffect(() => {
    const token = getSessionToken();
    if (token) {
      setUserData(token as string).catch((err) => console.error('Error fetching user data:', err));
    }
  }, []);

  async function handleSaveChanges(): Promise<void> {
    const parser = new UAParser();
    const browserName = parser.getBrowser().name;

    const jsonData: { [key: string]: any } = {
      "browser_info": browserName,
      "display_name": displayName,
      "description": description,
      "external_links": externalLinks,
      "birthday": birthday,
      "username": username
    };

    // Changing sensitive information (password/email),
    // require additional verification through current password...
    const changeSensitiveInformation = isNullOrWhitespace(email) || isNullOrWhitespace(newPassword);
    if (changeSensitiveInformation) {
      setShowPasswordModal(true);
      jsonData["verification_password"] = currentPassword;

      if (!isNullOrWhitespace(email)) {
        jsonData["email"] = email;
      }
      if (!isNullOrWhitespace(newPassword)) {
        jsonData["password"] = newPassword;
      }
    }

    jsonData["session_token"] = getSessionToken();

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    };
    const apiRoute = config.API_BASE_URL + '/api/users-edit/update-data';
    const response = await fetch(apiRoute, options);
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Failed to update user data: ', responseData);
      // TODO: Show user error based on response message/code.
      return;
    }

    // TODO: Handle responseData.message
    window.location.reload();
  };

  return (
    <>
      <h1 className="center-text">Edit Profile</h1>
      <div className="profile-editor">
        <div className="input-group">
          <div className="input-label">
            <label>Username</label>
          </div>
          <div className="input-control">
            <span>{username}</span>
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <div className="input-label">
            <label>Birthday</label>
          </div>
        </div>
        <div className="input-group">
          <div className="input-control">
            <DatePicker
              selected={birthday}
              onChange={(date: Date) => setBirthday(date)}
            />
          </div>
        </div>

        <ExternalLinksEditor
          externalLinks={externalLinks}
          setExternalLinks={setExternalLinks}
        />

        <div className="input-group">
          <label>Profile Description</label>
        </div>
        <DescriptionEditor
          initialDescription=""
          onDescriptionChange={setNewDescription}
        />

        <hr />
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <hr />
        <button type="submit" onClick={handleSaveChanges}>Save Changes</button>

        {/* Popup for the user's current password. */}
        <PasswordRequestor
          show={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
        />
      </div>

      <hr />
      <h1 className="center-text">Account Sessions</h1>
      <div className="session-token-editor-wrapper">
        <SessionTokenEditor
          sessionTokens={sessionTokens}
          removeSessionTokens={removeExistingSessionToken}
        />
      </div>
    </>
  );
};

export default ProfileEditor;
