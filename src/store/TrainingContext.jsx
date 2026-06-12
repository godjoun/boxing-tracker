import { createContext, useContext, useEffect, useState } from "react";

const TrainingContext = createContext();

export function TrainingProvider({ children }) {
  const [logs, setLogs] = useState(() => {
    const savedLogs = localStorage.getItem("boxingLogs");
    return savedLogs ? JSON.parse(savedLogs) : [];
  });

  const [feed, setFeed] = useState(() => {
    const savedFeed = localStorage.getItem("boxingFeed");
    return savedFeed ? JSON.parse(savedFeed) : [];
  });

  useEffect(() => {
    localStorage.setItem("boxingLogs", JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("boxingFeed", JSON.stringify(feed));
  }, [feed]);

  function addLog(newLog) {
    setLogs((prevLogs) => [
      {
        id: Date.now(),
        ...newLog,
      },
      ...prevLogs,
    ]);
  }

  function shareToFeed(log) {
    const alreadyShared = feed.some((item) => item.id === log.id);

    if (alreadyShared) {
      return;
    }

    setFeed((prevFeed) => [
      {
        ...log,
        feedId: Date.now(),
        sharedAt: new Date().toISOString(),
      },
      ...prevFeed,
    ]);
  }

  function unshareFromFeed(logId) {
    setFeed((prevFeed) => prevFeed.filter((item) => item.id !== logId));
  }

  function deleteFeed(feedId) {
    setFeed((prevFeed) => prevFeed.filter((item) => item.feedId !== feedId));
  }

  return (
    <TrainingContext.Provider
      value={{
        logs,
        feed,
        addLog,
        shareToFeed,
        unshareFromFeed,
        deleteFeed,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  return useContext(TrainingContext);
}