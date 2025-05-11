import { useEffect, useRef, useState } from 'react'
import csLogo from '/cs2-logo.png'
import ApexCharts from 'apexcharts'
import './App.css'
import { options } from './apexBaseOptions'
import { parseLog, type MatchData, type TEAMS } from './matchLogParser'

const cs2 = {
    blue: '#27387e',
    orange: '#e38719'
}

function App() {
    const [matchLog, setMatchLog] = useState<string>()
    const [matchData, setMatchData] = useState<MatchData>()
    const [currentRound, setCurrentRound] = useState<MatchData['rounds'][number]>()
    const [roundChart, setRoundChart] = useState<ApexCharts>()
    const [matchChart, setMatchChart] = useState<ApexCharts>()
    const roundChartRef = useRef<HTMLDivElement>(null)
    const matchChartRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        try {
            (async () => {
                const res = await fetch('match-log.txt')
                const text = await res.text()
                setMatchLog(text)
            })()
        } catch (err: any) {
            console.error(err.message)
        }
    }, [])

    useEffect(() => {
        if (matchLog) {
            setMatchData(parseLog(matchLog!))
        }
    }, [matchLog])

    useEffect(() => {
        if (roundChartRef.current && currentRound) {
            options.series = [
                {
                    name: 'Frag count',
                    data: [...currentRound.playerFrags].map((data) => data[1].count)
                }
            ]
            options.xaxis!.categories = [...currentRound.playerFrags].map((data) => data[0])
            options.colors = [...currentRound.playerFrags].map((data) => data[1].team === 'CT' ? cs2.blue : cs2.orange)

            if (!roundChart) {
                const chart = new ApexCharts(roundChartRef.current, options)
                setRoundChart(chart)
            } else if (roundChart && roundChartRef.current.childNodes.length) {
                roundChart.updateOptions(options)
            }
        }
    }, [roundChartRef.current, currentRound])

    useEffect(() => {
        if (matchChartRef.current && matchData) {
            const sortedFragsList = [...matchData.totalPlayerFrags].sort((a, b) => b[1].count - a[1].count)
            options.series = [
                {
                    name: 'Frag count',
                    data: sortedFragsList.map((data) => data[1].count)
                }
            ]
            options.xaxis!.categories = sortedFragsList.map((data) => data[0])
            options.colors = sortedFragsList.map((data) => data[1].team === 'CT' ? 'oklch(0.5 0.134 242.749)' : 'oklch(0.505 0.213 27.518)')

            if (!matchChart) {
                const chart = new ApexCharts(matchChartRef.current, options)
                setMatchChart(chart)
            } else if (matchChart && matchChartRef.current.childNodes.length) {
                matchChart?.updateOptions(options)
            }
        }
    }, [matchChartRef.current, matchData])

    useEffect(() => {
        roundChart?.render()
    }, [roundChart])

    useEffect(() => {
        matchChart?.render()
    }, [matchChart])

    return matchData ? (
        <>
            <div className={`w-vw mx-0 flex justify-center`} style={{ background: `linear-gradient(${cs2.orange} 60%, transparent)` }}>
                <div className='max-w-7xl w-[512px] h-[250px]' style={{ background: `linear-gradient(transparent 60%, #020618), url(${csLogo})`, backgroundSize: 'cover' }} />
            </div>

            <h1
                className='barlow-condensed-bold-italic text-7xl py-4 my-6 text-center bg-linear-to-r from-transparent from-20% via-slate-700 via-50% to-transparent to-80% border-y-2'
                style={{ borderImage: 'linear-gradient(to right, transparent 20%, #62748e 50%, transparent 80%) 1' }}
            >
                {matchData?.matchWinner} won the match!
            </h1>
            <h2 className='text-7xl text-center barlow-condensed-extralight'>[{matchData?.rounds.at(-1)?.currentScore}]</h2>
            <h3 className='text-3xl text-center barlow-condensed-bold mt-6'>{`${matchData?.rounds[0].TERRORIST} vs ${matchData?.rounds[0].CT}`}</h3>
            <h4 className='text-m text-center barlow-condensed-extralight'>{matchData?.matchStartDate?.friendlyFormatDate()}</h4>
            <h4 className='text-2xl text-center barlow-condensed-thin'><strong>Total Match time: </strong>{matchData!.matchLength} - <strong>Average Round Time: </strong>{matchData!.averageRoundTime}</h4>

            <div className='flex gap-4 max-w-4xl mx-auto justify-center mt-12'>
                <div className='flex gap-2 items-center'>
                    <div className={`w-5 h-5 bg-sky-700`}></div>
                    <span>{matchData.rounds.at(-1)?.CT}</span>
                </div>
                <div className='flex gap-2 items-center'>
                    <div className={`w-5 h-5 bg-red-700`}></div>
                    <span>{matchData.rounds.at(-1)?.TERRORIST}</span>
                </div>
            </div>

            <div ref={matchChartRef} className='max-w-4xl mx-auto'></div>

            <div className='mx-16 my-8'>
                <div className='flex gap-4'>
                    <div className='flex gap-2 items-center'>
                        <div className={`w-5 h-5 bg-cs2-blue`}></div>
                        <span>Counter-Terrorists</span>
                    </div>
                    <div className='flex gap-2 items-center'>
                        <div className={`w-5 h-5 bg-cs2-orange`}></div>
                        <span>Terrorists</span>
                    </div>
                </div>

                <h3 className='text-5xl barlow-condensed-semibold pl-4 my-6 border-b-2 pb-2'>Rounds</h3>

                <div className='grid grid-cols-11 gap-4'>
                    {
                        matchData?.rounds.map((round, index) => (
                            <button
                                className={`bg-${round.winner === 'CT' ? 'cs2-blue' : 'cs2-orange'} barlow-condensed-regular text-lg flex flex-col items-center px-2 py-2 hover:inset-ring-2 transition-all duration-300 ${currentRound === round ? 'inset-ring-2' : ''}`}
                                key={round.roundStart?.getTime()}
                                onClick={() => setCurrentRound(round)}
                            >
                                <div className='border-2 rounded-full w-[35px] h-[35px] flex items-center justify-center'><span className='barlow-condensed-bold-italic'>{index + 1}</span></div>
                                <span>[{round[round.winner as TEAMS]}]</span>
                            </button>
                        ))
                    }
                </div>

                {currentRound ? (
                    <div>
                        <div className='grid grid-cols-3 justify-items-stretch py-12'>
                            <div className='flex items-center flex-col border-r-2 gap-2'>
                                <p className='text-3xl font-semibold bg-linear-to-r from-transparent w-full text-center from-20% via-slate-900 via-50% to-transparent to-80% border-y-2'
                                    style={{ borderImage: 'linear-gradient(to right, transparent 20%, #314158 50%, transparent 80%) 1' }}>Partial score</p>
                                <span className='text-2xl font-thin'>{currentRound.currentScore}</span>
                            </div>

                            <div className='flex items-center flex-col border-r-2 gap-2'>
                                <p className='text-3xl font-semibold bg-linear-to-r from-transparent w-full text-center from-20% via-slate-900 via-50% to-transparent to-80% border-y-2'
                                    style={{ borderImage: 'linear-gradient(to right, transparent 20%, #314158 50%, transparent 80%) 1' }}>Winner</p>
                                <span className='text-2xl font-thin'>{currentRound[currentRound.winner as TEAMS]} [{currentRound.winner}]</span>
                            </div>

                            <div className='flex items-center flex-col gap-2'>
                                <p className='text-3xl font-semibold bg-linear-to-r from-transparent w-full text-center from-20% via-slate-900 via-50% to-transparent to-80% border-y-2'
                                    style={{ borderImage: 'linear-gradient(to right, transparent 20%, #314158 50%, transparent 80%) 1' }}>Round time</p>
                                <span className='text-2xl font-thin'>{currentRound.timeElapsed}</span>
                            </div>
                        </div>

                        <div ref={roundChartRef} className='max-w-4xl mx-auto'></div>

                    </div>
                ) : null}

            </div>

            <footer className='flex justify-center items-baseline-last gap-2 my-6'>
                <p>Created by Kevin Coscarelli for</p>
                <img className="h-4 transition-all" alt="Home" src="data:image/svg+xml,%3csvg%20width='26'%20height='30'%20viewBox='0%200%2026%2030'%20fill='none'%20xmlns='http://www.w3.org/2000/svg'%3e%3cg%20id='Type=Mark'%3e%3cpath%20id='Union'%20fill-rule='evenodd'%20clip-rule='evenodd'%20d='M13.8233%200L10.8688%206.15782L20.2874%2013.4723L13.8233%200ZM12.5626%2017.1676L18.367%2016.6396L17.4623%2014.7538L7.86423%207.29977L2.69927%2018.0645L9.03341%2017.4884L10.875%2013.65L12.5626%2017.1676ZM14.4962%2019.6912L20.3007%2019.1633L25.5%2030H0L4.51005%2020.5996L10.8442%2020.0232L8.66156%2024.5728H16.8384L14.4962%2019.6912Z'%20fill='white'/%3e%3c/g%3e%3c/svg%3e"></img>
            </footer>
        </>
    ) : null
}

export default App
