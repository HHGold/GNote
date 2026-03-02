package com.chinhsiang.premiumnotes;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 必須在 super.onCreate() 之前註冊，否則橋樑建好時會找不到 Plugin
        registerPlugin(UpdatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
