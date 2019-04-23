/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useEffect, useState, memo } from 'react'
import './BigScreen.css'
import { translate as t } from '@doubledutch/admin-client'
import Avatar from './components/Avatar'
import Question from './Question'

const numJoinedToShow = 7
const Option = ({ text, correct, guesses, totalGuesses }) => (
  <div className={`option ${correct ? 'correct' : ''}`}>
    <div className="option-text-back">
      <span>{text}</span>
      <span>{guesses != null && guesses}</span>
    </div>
    {guesses != null ? (
      <div className="option-overlay">
        <div style={{ width: `${(guesses / totalGuesses) * 100}%` }}>
          <div className="option-text-front">
            <span>{text}</span>
            <span>{guesses != null && guesses}</span>
          </div>
        </div>
      </div>
    ) : null}
  </div>
)

const BigScreen = ({ className, fbc, sessionId }) => {
  const [session, setSession] = useState()
  const [backgroundUrl, setBackgroundUrl] = useState()
  const [joined, setJoined] = useState([])

  useEffect(() => {
    const sessionRef = fbc.database.public.adminRef('sessions').child(sessionId)
    const backgroundUrlRef = fbc.database.public.adminRef('backgroundUrl')
    const usersRef = fbc.database.public.usersRef()

    backgroundUrlRef.on('value', data => setBackgroundUrl(data.val()))
    sessionRef.on('value', data => setSession(data.val()))
    usersRef.on('child_added', data => {
      const user = data.val()
      if (user.sessionId === sessionId) {
        setJoined([...joined, { ...user, id: data.key }])
      }
    })
    const removeJoinedUser = data => setJoined(joined.filter(u => u.id !== data.key))
    usersRef.on(
      'child_changed',
      data => data.val().sessionId !== sessionId && removeJoinedUser(data),
    )
    usersRef.on('child_removed', removeJoinedUser)

    return function cleanup() {
      backgroundUrlRef.off('value')
      sessionRef.off('value')
      usersRef.off('child_added')
      usersRef.off('child_changed')
      usersRef.off('child_removed')
    }
  }, [sessionId])

  const renderNonexistent = () => (
    <div
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : null}
      className="big-screen"
    >
      <div className="box box-content">{t('initialize')}</div>
    </div>
  )

  function renderNotStarted() {
    if (joined.length === 0) {
      return (
        <div className="box joined">
          <div className="box-content">
            <h1>{t('waiting')}</h1>
            <h2>{t('toJoin')}</h2>
          </div>
        </div>
      )
    }

    return (
      <div className="box joined">
        <div className="box-content">
          <h1>{joined.length}</h1>
          <h2>{joined.length > 1 ? 'Have' : 'Has'} Joined</h2>
          <div className="attendees-joined">
            {joined.slice(Math.max(0, joined.length - numJoinedToShow)).map((u, i) => (
              <div key={u.id}>
                <Avatar user={u} size={7} units="vh" />
                <span>
                  {u.firstName} {u.lastName}
                </span>
                &nbsp;{t('hasJoined')}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  function renderOpenQuestion() {
    const { question } = session
    return (
      <Question
        question={question}
        number={question.index + 1}
        totalSeconds={question.totalSeconds}
        countDown
      >
        {question.options.map((opt, i) => !!opt && <Option key={i} text={opt} />)}
      </Question>
    )
  }

  function renderClosedQuestion() {
    const { question } = session
    return (
      <Question question={question} number={question.index + 1} totalSeconds={0}>
        {question.options.map(
          (opt, i) =>
            !!opt && (
              <Option
                key={i}
                text={opt}
                guesses={question.guesses[i]}
                totalGuesses={question.totalGuesses}
                correct={i === question.correctIndex}
              />
            ),
        )}
      </Question>
    )
  }

  function renderLeaderboard() {
    const { leaderboard } = session
    const customStyle = p =>
      p.place === 1
        ? {
            transform: 'scale(1.5)',
            margin: '7vh auto',
          }
        : null
    return (
      <div className="leaderboard">
        <h1>{t('leaderboard')}</h1>
        {leaderboard &&
          leaderboard.map((p, i) => (
            <div key={i} className="leaderboard-tile box" style={customStyle(p)}>
              <div className="leaderboard-place">{p.place}</div>
              <Avatar user={p.user} size={5} units="vh" />
              <div className="leaderboard-name">
                {p.user.firstName} {p.user.lastName}
              </div>
              <div className="leaderboard-points">
                {p.score} {p.score === 1 ? 'pt' : 'pts'}
                {p.score && (
                  <p className="leaderboard-time">
                    Avg {p.time ? Math.round(10 * (p.time / p.score / 1000)) / 10 : 0} s
                  </p>
                )}
              </div>
            </div>
          ))}
      </div>
    )
  }

  function renderState() {
    switch (session.state) {
      case 'NOT_STARTED':
        return renderNotStarted()
      case 'QUESTION_OPEN':
        return renderOpenQuestion()
      case 'QUESTION_CLOSED':
        return renderClosedQuestion()
      case 'LEADERBOARD':
      case 'ENDED':
        return renderLeaderboard()
      default:
        return null
    }
  }

  if (session === undefined) return <div>Loading...</div>
  if (!session) return renderNonexistent()
  return (
    <div
      className={`big-screen ${className}`}
      style={backgroundUrl ? { backgroundImage: `url(${backgroundUrl})` } : null}
    >
      {renderState(session)}
    </div>
  )
}

export default memo(BigScreen)
