from selenium import webdriver


def download(driver, target_path):
    """Download the currently displayed page to target_path."""
    def execute(script, args):
        driver.execute('executePhantomScript',
                       {'script': script, 'args': args})

    # hack while the python interface lags
    driver.command_executor._commands['executePhantomScript'] = (
        'POST', '/session/$sessionId/phantom/execute')
    # set page format
    # inside the execution script, webpage is "this"
    page_format = 'this.paperSize = {format: "A4", orientation: "portrait" };'
    execute(page_format, [])

    # render current page
    render = '''this.render("{}")'''.format(target_path)
    execute(render, [])


driver = webdriver.PhantomJS()
driver.set_window_size(1120, 550)
driver.get("https://duckduckgo.com/")
driver.find_element_by_id('search_form_input_homepage').send_keys("realpython")
driver.find_element_by_id("search_button_homepage").click()
# driver.save_screenshot("bulletin.pdf")
download(driver, "bulletin.pdf")

print(driver.current_url)
driver.quit()
