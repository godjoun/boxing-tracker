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
    setLogs([
      {
        id: Date.now(),
        ...newLog,
      },
      ...logs,
    ]);
  }

  function shareToFeed(log) {
    const alreadyShared = feed.some((item) => item.id === log.id);

    if (alreadyShared) {
      return;
    }

    setFeed([
      {
        ...log,
        feedId: Date.now(),
        sharedAt: new Date().toISOString(),
      },
      ...feed,
    ]);
  }

  function deleteFeed(feedId) {
    setFeed((prevFeed) => prevFeed.filter((item) => item.feedId !== feedId));
  }

  function unshareFromFeed(logId) {
    setFeed((prevFeed) => prevFeed.filter((item) => item.id !== logId));
  }

  return (
    <TrainingContext.Provider
      value={{
        logs,
        feed,
        addLog,
        shareToFeed,
        deleteFeed,
        unshareFromFeed,
      }}
    >
      {children}
    </TrainingContext.Provider>
  );
}

export function useTraining() {
  return useContext(TrainingContext);
}