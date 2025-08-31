<<<<<<< HEAD
import sys
from PyQt5.QtCore import QUrl
from PyQt5.QtGui import QIcon
from PyQt5.QtWidgets import QApplication, QMainWindow, QToolBar, QAction, QLineEdit
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineProfile, QWebEnginePage


class NoCacheBrowser(QMainWindow):
    def __init__(self):
        super().__init__()
        # Устанавливаем заголовок окна
        self.setWindowTitle("BaffyNet - PrivacyNet")

        # Устанавливаем иконку окна
        self.setWindowIcon(QIcon("icon.png"))

        # Устанавливаем размер окна
        self.resize(1200, 800)

        profile = QWebEngineProfile(self)
        profile.setCachePath("")  # Отключаем кэширование на диске
        profile.setPersistentCookiesPolicy(QWebEngineProfile.NoPersistentCookies)
        profile.setHttpCacheType(QWebEngineProfile.MemoryHttpCache)  # Кэш только в памяти
        profile.setPersistentStoragePath("")  # Отключаем localStorage

        page = QWebEnginePage(profile, self)
        self.browser = QWebEngineView(self)
        self.browser.setPage(page)

        self.setCentralWidget(self.browser)
        self.browser.load(QUrl("https://baffynet.rf.gd"))

        # Создаем панель инструментов с кнопками и строкой ввода URL
        navtb = QToolBar("Navigation")
        self.addToolBar(navtb)

        back_btn = QAction("<", self)
        back_btn.triggered.connect(self.browser.back)
        navtb.addAction(back_btn)

        forward_btn = QAction(">", self)
        forward_btn.triggered.connect(self.browser.forward)
        navtb.addAction(forward_btn)

        reload_btn = QAction("⟳", self)
        reload_btn.triggered.connect(self.browser.reload)
        navtb.addAction(reload_btn)

        # Добавляем поле ввода URL/поиска
        self.urlbar = QLineEdit()
        self.urlbar.returnPressed.connect(self.navigate_to_url)
        navtb.addWidget(self.urlbar)

        # Обновляем адрес в urlbar при загрузке страницы
        self.browser.urlChanged.connect(self.update_urlbar)

        # Устанавливаем темную тему через стили
        dark_style = """
            QMainWindow {
                background-color: #121212;
                color: #ffffff;
            }
            QToolBar {
                background-color: #1f1f1f;
                spacing: 10px;
            }
            QAction {
                color: #ffffff;
                font-weight: bold;
            }
            QToolBar QToolButton {
                color: #ffffff;
                background-color: #333333;
                border: none;
                padding: 5px 10px;
                margin: 2px;
            }
            QToolBar QToolButton:hover {
                background-color: #555555;
            }
            QLineEdit {
                background-color: #333333;
                color: white;
                border: 1px solid #555555;
                padding: 5px;
                min-width: 300px;
            }
        """
        self.setStyleSheet(dark_style)

        self.show()

    def navigate_to_url(self):
        text = self.urlbar.text().strip()
        if text:
            if not (text.startswith("http://") or text.startswith("https://")):
                # Если введён не URL, считаем что это поисковый запрос и формируем Google-поиск
                text = "https://www.google.com/search?q=" + QUrl.toPercentEncoding(text).data().decode()
            self.browser.load(QUrl(text))

    def update_urlbar(self, qurl):
        self.urlbar.setText(qurl.toString())
        self.urlbar.setCursorPosition(0)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = NoCacheBrowser()
=======
import sys
from PyQt5.QtCore import QUrl
from PyQt5.QtGui import QIcon
from PyQt5.QtWidgets import QApplication, QMainWindow, QToolBar, QAction, QLineEdit
from PyQt5.QtWebEngineWidgets import QWebEngineView, QWebEngineProfile, QWebEnginePage


class NoCacheBrowser(QMainWindow):
    def __init__(self):
        super().__init__()
        # Устанавливаем заголовок окна
        self.setWindowTitle("BaffyNet - PrivacyNet")

        # Устанавливаем иконку окна
        self.setWindowIcon(QIcon("icon.png"))

        # Устанавливаем размер окна
        self.resize(1200, 800)

        profile = QWebEngineProfile(self)
        profile.setCachePath("")  # Отключаем кэширование на диске
        profile.setPersistentCookiesPolicy(QWebEngineProfile.NoPersistentCookies)
        profile.setHttpCacheType(QWebEngineProfile.MemoryHttpCache)  # Кэш только в памяти
        profile.setPersistentStoragePath("")  # Отключаем localStorage

        page = QWebEnginePage(profile, self)
        self.browser = QWebEngineView(self)
        self.browser.setPage(page)

        self.setCentralWidget(self.browser)
        self.browser.load(QUrl("https://google.com"))

        # Создаем панель инструментов с кнопками и строкой ввода URL
        navtb = QToolBar("Navigation")
        self.addToolBar(navtb)

        back_btn = QAction("<", self)
        back_btn.triggered.connect(self.browser.back)
        navtb.addAction(back_btn)

        forward_btn = QAction(">", self)
        forward_btn.triggered.connect(self.browser.forward)
        navtb.addAction(forward_btn)

        reload_btn = QAction("⟳", self)
        reload_btn.triggered.connect(self.browser.reload)
        navtb.addAction(reload_btn)

        # Добавляем поле ввода URL/поиска
        self.urlbar = QLineEdit()
        self.urlbar.returnPressed.connect(self.navigate_to_url)
        navtb.addWidget(self.urlbar)

        # Обновляем адрес в urlbar при загрузке страницы
        self.browser.urlChanged.connect(self.update_urlbar)

        # Устанавливаем темную тему через стили
        dark_style = """
            QMainWindow {
                background-color: #121212;
                color: #ffffff;
            }
            QToolBar {
                background-color: #1f1f1f;
                spacing: 10px;
            }
            QAction {
                color: #ffffff;
                font-weight: bold;
            }
            QToolBar QToolButton {
                color: #ffffff;
                background-color: #333333;
                border: none;
                padding: 5px 10px;
                margin: 2px;
            }
            QToolBar QToolButton:hover {
                background-color: #555555;
            }
            QLineEdit {
                background-color: #333333;
                color: white;
                border: 1px solid #555555;
                padding: 5px;
                min-width: 300px;
            }
        """
        self.setStyleSheet(dark_style)

        self.show()

    def navigate_to_url(self):
        text = self.urlbar.text().strip()
        if text:
            if not (text.startswith("http://") or text.startswith("https://")):
                # Если введён не URL, считаем что это поисковый запрос и формируем Google-поиск
                text = "https://www.google.com/search?q=" + QUrl.toPercentEncoding(text).data().decode()
            self.browser.load(QUrl(text))

    def update_urlbar(self, qurl):
        self.urlbar.setText(qurl.toString())
        self.urlbar.setCursorPosition(0)


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = NoCacheBrowser()
>>>>>>> 6689857cee2265f9fc8a1f95d087a264dc9b4033
    sys.exit(app.exec_())