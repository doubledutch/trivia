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

import React, { PureComponent } from 'react'
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native'

import colors from './colors'

export default class Question extends PureComponent {
  state = {selectedIndex: null}
  
  componentDidMount() {
    this.setState({secondsLeft: this.props.totalSeconds})
    this.props.countDown && this.startTimer(this.props)
  }

  startTimer(props) {
    const {totalSeconds} = props
    const start = new Date().valueOf()
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      const now = new Date().valueOf()
      const elapsedSeconds = (now - start)/1000
      if (elapsedSeconds > totalSeconds) {
        clearInterval(this.timer)
      }
      this.setState({secondsLeft: Math.max(0, totalSeconds - elapsedSeconds)})
    }, 500)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.totalSeconds !== nextProps.totalSeconds) {
      this.setState({secondsLeft: nextProps.totalSeconds})
    }
    
    if (nextProps.countDown && (this.props.question !== nextProps.question || this.props.totalSeconds !== nextProps.totalSeconds)) {
      this.startTimer(nextProps)
    }
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    const {question, totalSeconds} = this.props
    const {secondsLeft, selectedIndex} = this.state

    const percentLeft = `${(secondsLeft / totalSeconds) * 100}%`
    return (
      <View style={s.box}>
        <View style={[s.boxContent, s.questionTop]}>
          <Text style={s.questionNumber}>Question {question.index + 1}</Text>
          <Text style={s.timeRemaining}>{durationString(secondsLeft)}</Text>
        </View>
        <View style={s.timerBar}>
          <View style={[s.timerBarRemaining, {width: percentLeft}]} />
        </View>
        <View style={s.boxContent}>
          <Text style={s.questionText}>{question.text}</Text>
          <View style={s.options}>
            { question.options.map((opt, i) => (
              <TouchableOpacity key={i} style={[s.option, selectedIndex === i ? s.selectedOption : null]}>
                <Text style={[s.optionText, selectedIndex === i ? s.selectedOptionText : null]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>        
      </View>
    )
  }
}

function durationString(seconds) {
  const s = Math.ceil(seconds)
  const sRem = s % 60
  const m = Math.floor(s / 60)
  return `${m}:${sRem < 10 ? '0' : ''}${sRem}`
}

const s = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  boxContent: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  questionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  questionNumber: {
    fontSize: 18,
    color: colors.gray,
  },
  timeRemaining: {
    fontSize: 18,
    color: colors.teal,
  },
  timerBar: {
    backgroundColor: colors.lightGray,
    height: 5,
  },
  timerBarRemaining: {
    backgroundColor: colors.teal,
    position: 'absolute',
    right: 0,
    height: '100%',
  },
  questionText: {
    color: colors.purple,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  options: {
    
  },
  option: {
    borderRadius: 20,
    height: 40,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderColor: colors.gray,
    borderWidth: 2,
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  selectedOption: {

  },
  optionText: {
    color: colors.gray,
  },
  selectedOptionText: {

  },
})
