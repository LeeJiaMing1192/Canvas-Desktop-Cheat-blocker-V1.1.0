#include <windows.h>
#include <iostream>

HHOOK hHook;

LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam) {
    if (nCode == HC_ACTION) {
        KBDLLHOOKSTRUCT* p = (KBDLLHOOKSTRUCT*)lParam;
        bool shouldBlock = false;

        // Block ESC key
        if (p->vkCode == VK_ESCAPE) {
            shouldBlock = true;
        }
        // Block ALT+F4
        else if ((GetAsyncKeyState(VK_MENU) & 0x8000) && p->vkCode == VK_F4) {
            shouldBlock = true;
        }
        // Block ALT+TAB and ALT+SHIFT+TAB
        else if ((GetAsyncKeyState(VK_MENU) & 0x8000) && p->vkCode == VK_TAB) {
            shouldBlock = true;
        }
        // Block Windows key (LWin/RWin) and ALL Windows key combinations
        else if (p->vkCode == VK_LWIN || p->vkCode == VK_RWIN || 
                (GetAsyncKeyState(VK_LWIN) & 0x8000) || 
                (GetAsyncKeyState(VK_RWIN) & 0x8000)) {
            shouldBlock = true;
        }
        // Block CTRL+ESC (Start Menu)
        else if ((GetAsyncKeyState(VK_CONTROL) & 0x8000) && p->vkCode == VK_ESCAPE) {
            shouldBlock = true;
        }
        // Block ALT+ESC
        else if ((GetAsyncKeyState(VK_MENU) & 0x8000) && p->vkCode == VK_ESCAPE) {
            shouldBlock = true;
        }
        // Block CTRL+SHIFT+ESC (Task Manager)
        else if ((GetAsyncKeyState(VK_CONTROL) & 0x8000) && 
                (GetAsyncKeyState(VK_SHIFT) & 0x8000) && 
                p->vkCode == VK_ESCAPE) {
            shouldBlock = true;
        }

        if (shouldBlock) {
            return 1; // Block the key
        }
    }
    return CallNextHookEx(hHook, nCode, wParam, lParam);
}

int main() {
    HINSTANCE hInstance = GetModuleHandle(NULL);
    hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, hInstance, 0);

    if (!hHook) {
        std::cerr << "Hook failed." << std::endl;
        return 1;
    }

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    UnhookWindowsHookEx(hHook);
    return 0;
}