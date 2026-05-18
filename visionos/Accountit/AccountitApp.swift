//
//  AccountitApp.swift
//  Accountit
//
//  Created by Jinwoo Kim on 5/17/26.
//

#if canImport(MySwiftUI)
import MySwiftUI
#else
import SwiftUI
#endif

@main
struct AccountitApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
#if !canImport(MySwiftUI)
                .ignoresSafeArea()
#endif
        }
    }
}

fileprivate struct RootView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> RootViewController {
        return RootViewController()
    }

    func updateUIViewController(_ uiViewController: RootViewController, context: Context) {
    }
}
