import { Component } from "react";
import { BRAND_NAME } from "../utils/brand";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`[${BRAND_NAME}] unrecoverable UI error`, error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="alert"
        style={{
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#0a0a0a",
          color: "#f5f1e8",
          textAlign: "center",
        }}
      >
        <section style={{ maxWidth: "360px" }}>
          <p style={{ color: "#b8a99a", fontWeight: 800 }}>{BRAND_NAME}</p>
          <h1 style={{ margin: "8px 0 12px", fontSize: "24px" }}>
            화면을 다시 열어야 합니다
          </h1>
          <p style={{ color: "#b8a99a", lineHeight: 1.6 }}>
            기기에 저장된 훈련 기록은 그대로 유지됩니다. 같은 문제가 반복되면
            더보기에서 JSON 백업을 먼저 보관해 주세요.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              width: "100%",
              marginTop: "18px",
              padding: "14px 16px",
              border: 0,
              borderRadius: "14px",
              background: "#8a2e2e",
              color: "#f5f1e8",
              fontSize: "15px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            앱 다시 열기
          </button>
        </section>
      </main>
    );
  }
}
