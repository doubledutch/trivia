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
  state = { selectedIndex: null }

  componentDidMount() {
    this.setState({ secondsLeft: this.props.totalSeconds })
    this.props.countDown && this.startTimer(this.props)
  }

  startTimer(props) {
    const { totalSeconds } = props
    const start = new Date().valueOf()
    if (this.timer) clearInterval(this.timer)
    this.timer = setInterval(() => {
      const now = new Date().valueOf()
      const elapsedSeconds = (now - start) / 1000
      if (elapsedSeconds > totalSeconds) {
        clearInterval(this.timer)
      }
      this.setState({ secondsLeft: Math.max(0, totalSeconds - elapsedSeconds) })
    }, 500)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.totalSeconds !== nextProps.totalSeconds) {
      this.setState({ secondsLeft: nextProps.totalSeconds })
      if (this.timer) clearInterval(this.timer)
    }

    if (
      nextProps.countDown &&
      (this.props.question !== nextProps.question ||
        this.props.totalSeconds !== nextProps.totalSeconds)
    ) {
      this.lastSelected = null
      this.startTimer(nextProps)
    }
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    const { question, selectedIndex, totalSeconds } = this.props
    const { secondsLeft } = this.state

    const percentLeft = `${(secondsLeft / totalSeconds) * 100}%`
    return (
      <View style={s.box}>
        <View style={[s.boxContent, s.questionTop]}>
          <Text style={s.questionNumber}>Question {question.index + 1}</Text>
          <Text style={secondsLeft === 0 ? s.timeZeroRemaining : s.timeRemaining}>
            {durationString(secondsLeft)}
          </Text>
        </View>
        <View style={s.timerBar}>
          <View style={[s.timerBarRemaining, { width: percentLeft }]} />
        </View>
        <View style={s.boxContent}>
          <Text style={s.questionText}>{question.text}</Text>
          <View>
            {question.options.map(
              (opt, i) =>
                !!opt && (
                  <TouchableOpacity
                    disabled={!this.props.onOptionSelected}
                    key={`${question.index}-${i}-${opt}-${question.correctIndex}`}
                    style={[
                      s.option,
                      question.correctIndex == null
                        ? selectedIndex === i // Correct answer not revealed yet...
                          ? s.selectedOption // ...and this is the answer currently selected
                          : null // ...and this is not the answer currently selected
                        : question.correctIndex === i // Correct answer has been revealed...
                        ? s.correctOption // ...and this answer is the correct answer
                        : question.correctIndex !== i && this.lastSelected === i
                        ? s.incorrectOption // ...and this is not the correct answer, but was chosen by the player.
                        : null, // ...and this is not the correct answer, and was not chosen by the player.
                    ]}
                    onPress={this.selectOption(i)}
                  >
                    <Text
                      style={[
                        s.optionText,
                        selectedIndex === i ||
                        this.lastSelected === i ||
                        question.correctIndex === i
                          ? s.highlightedOptionText
                          : null,
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ),
            )}
          </View>
        </View>
      </View>
    )
  }

  selectOption = i => () => {
    this.lastSelected = i // Track last selected index even after the recorded responses are cleared (as long as the question remains unchanged)
    this.props.onOptionSelected(i)
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
  timeZeroRemaining: {
    fontSize: 18,
    color: colors.orange,
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
  option: {
    borderRadius: 25,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    borderColor: colors.gray,
    borderWidth: 2,
    paddingHorizontal: 15,
    marginVertical: 10,
  },
  selectedOption: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  optionText: {
    color: colors.gray,
    fontSize: 18,
  },
  highlightedOptionText: {
    color: '#fff',
  },
  correctOption: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  incorrectOption: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
})
