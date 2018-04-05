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

import React, {PureComponent} from 'react'
import './BigScreen.css'

export default class BigScreen extends PureComponent {
  state = {joined: []}
  componentDidMount() {
    const {sessionId} = this.props
    this.sessionRef().on('value', data => this.setState({session: data.val()}))
    this.usersRef().on('child_added', data => {
      const user = data.val()
      if (user.sessionId === sessionId) {
        this.setState(state => ({joined: [...state.joined, {...user, id: data.key}]}))
      }
    })
  }

  render() {
    const {session, joined} = this.state
    if (session === undefined) return <div>Loading...</div>
    if (!session) return <div>Session not found</div>
    return (
      <div className="big-screen">
        { session.state === 'NOT_STARTED' && joined.length
          ? <div className="box joined">
              <h1>{joined.length}</h1>
              <h2>{joined.length > 1 ? 'Have':'Has'} Joined</h2>
              <div className="attendees-joined"></div>
            </div>
          : <div className="box joined"><h1>Waiting for Players</h1></div>
        }
      </div>
    )
  }

  sessionRef = () => this.props.fbc.database.public.adminRef('sessions').child(this.props.sessionId)
  usersRef = () => this.props.fbc.database.private.adminableUsersRef()
}
