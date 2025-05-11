export type TEAMS = 'TERRORIST' | 'CT'

export type MatchData = {
    matchStartDate: Date | null,
    matchEndDate: Date | null,
    matchLength: string,
    matchWinner: string,
    rounds: {
        playerFrags: Map<string, { team: string, count: number }>
        roundStart: Date | null,
        roundEnd: Date | null,
        timeElapsed: string,
        TERRORIST: string,
        CT: string,
        winner: TEAMS | '',
        currentScore: string
    }[],
    totalPlayerFrags: Map<string, { team: string, count: number }>,
    averageRoundTime: string,
}

function parseLogTimestamp(timestampStr: string) {
    const [datePart, timePart] = timestampStr.split(' - ')
    const [month, day, year] = datePart.split('/').map((val) => Number(val))
    const [hours, minutes, seconds] = timePart.split(':').map((val) => Number(val))

    return new Date(year, month - 1, day, hours, minutes, seconds)
}

function formatDuration(ms: number) {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24)

    return [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        `${seconds}s`
    ].filter((val) => Boolean(val)).join(' ')
}

function getTimeDifference(startTimestamp: Date, endTimestamp: Date) {
    const diff = endTimestamp.getTime() - startTimestamp.getTime()
    return formatDuration(diff)
}

class LineData {
    private _line: string
    private _timestamp: string = ''
    private _message: string = ''
    constructor(line: string) {
        this._line = line
    }

    private setValues() {
        const timeMatch = this._line.match(/^(\d{2}\/\d{2}\/\d{4} - \d{2}:\d{2}:\d{2}):/)
        if (!timeMatch) throw new Error('Unmatched date log')
        this._timestamp = timeMatch[1]
        this._message = this._line.slice(timeMatch[0].length).trim()
    }

    get timestamp() {
        if (this._timestamp) return this._timestamp
        this.setValues()
        return this._timestamp
    }

    get message() {
        if (this._message) return this._message
        this.setValues()
        return this._message
    }
}

export function parseLog(log: string) {

    const matchData: MatchData = {
        totalPlayerFrags: new Map(),
        matchStartDate: null,
        matchEndDate: null,
        matchLength: '',
        rounds: [],
        averageRoundTime: '',
        matchWinner: '',
    }

    let lines = log.split('\n')
    // Trim irrelevant lines
    const startTrimIndex = lines.findLastIndex((line) => line.includes('World triggered "Match_Start"'))
    const endTrimIndex = lines.findLastIndex((line) => line.includes('World triggered "Round_Start"'))

    lines = lines.slice(startTrimIndex, endTrimIndex)

    for (const [index, line] of lines.entries()) {

        const lineData = new LineData(line)

        // Get official match start timestamp
        if (index === 0) {
            matchData.matchStartDate = parseLogTimestamp(lineData.timestamp)
        }

        // Get official match end timestamp
        else if (index === (lines.length - 1)) {
            matchData.matchEndDate = parseLogTimestamp(lineData.timestamp)
        }

        // Push new round to array
        if (lineData.message.includes('World triggered "Round_Start"')) {
            matchData.rounds.push({
                playerFrags: new Map(),
                roundStart: parseLogTimestamp(lineData.timestamp),
                roundEnd: null,
                timeElapsed: '',
                currentScore: '',
                CT: '',
                TERRORIST: '',
                winner: ''
            })
        }

        // Get round end timestamp and calculate time elapsed
        else if (lineData.message.includes('World triggered "Round_End"')) {
            const lastRound = matchData.rounds.at(-1)!
            lastRound.roundEnd = parseLogTimestamp(lineData.timestamp)
            lastRound.timeElapsed = getTimeDifference(lastRound.roundStart!, lastRound.roundEnd!)
        }

        // Get match winner
        else if (lineData.message.includes('Team') && lineData.message.includes('won.')) {
            const winnerMatch = lineData.message.match(/Team (.+?) won./)
            matchData.matchWinner = winnerMatch![1]
        }

        else if (matchData.rounds.length) {
            const lastRound = matchData.rounds.at(-1)!

            // Get round and match plaer frags
            if (lineData.message.includes(' killed ') && lineData.message.includes(' with ')) {
                const fraggerName = lineData.message.match(/"(.+?)<.+?>.+?"/)![1]
                if (lastRound.playerFrags.has(fraggerName)) {
                    lastRound.playerFrags.get(fraggerName)!.count++
                } else {
                    lastRound.playerFrags.set(fraggerName, {
                        count: 1,
                        team: lineData.message.match(/<(TERRORIST|CT)>/)![1]
                    })
                }

                if (matchData.totalPlayerFrags.has(fraggerName)) {
                    matchData.totalPlayerFrags.get(fraggerName)!.count++
                } else {
                    matchData.totalPlayerFrags.set(fraggerName, {
                        count: 1,
                        team: lineData.message.match(/<(TERRORIST|CT)>/)![1]
                    })
                }
            }

            // Get CT team
            else if (matchData.rounds.at(-1) && lineData.message.includes('MatchStatus: Team playing "CT":')) {
                const ctMatch = lineData.message.match(/"CT": (.+)$/)
                if (ctMatch) {
                    lastRound.CT = ctMatch[1].trim()
                }
            }

            // Get T team
            else if (matchData.rounds.at(-1) && lineData.message.includes('MatchStatus: Team playing "TERRORIST":')) {
                const tMatch = lineData.message.match(/"TERRORIST": (.+)$/)
                if (tMatch) {
                    lastRound.TERRORIST = tMatch[1].trim()
                }
            }

            // Get round winner
            else if (lineData.message.includes('"SFUI_Notice_CTs_Win"') || lineData.message.includes("SFUI_Notice_Bomb_Defused")) {
                lastRound.winner = 'CT'
            }
            else if (lineData.message.includes('"SFUI_Notice_Terrorists_Win"') || lineData.message.includes("SFUI_Notice_Target_Bombed")) {
                lastRound.winner = 'TERRORIST'
            }

            // Get current score
            else if (lineData.message.includes('MatchStatus: Score:')) {
                const scoreMatch = lineData.message.match(/Score: (\d+:\d+)/)
                if (scoreMatch) {
                    lastRound.currentScore = scoreMatch[1]
                }
            }
        }
    }

    matchData.matchLength = getTimeDifference(matchData.matchStartDate!, matchData.matchEndDate!)
    matchData.averageRoundTime = formatDuration(
        (matchData.matchEndDate!.getTime() - matchData.matchStartDate!.getTime()) / matchData.rounds.length)

    return matchData
}